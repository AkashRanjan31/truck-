import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getNearbyReports, getTrafficZones, updateLocation } from '../services/api';
import { connectSocket } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../context/DriverContext';
import LocationMapModal from '../components/LocationMapModal';
import SosAlertPopup from '../components/SosAlertPopup';
import './MapPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️',
};
const MARKER_COLORS = {
  police_harassment: '#e74c3c', extortion: '#e67e22', unsafe_parking: '#3498db',
  accident_zone: '#c0392b', poor_road: '#95a5a6', other: '#f39c12',
};

function createIcon(type) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#1a1a2e;border:2px solid ${MARKER_COLORS[type]};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${ISSUE_ICONS[type]}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function RecenterMap({ coords }) {
  const map = useMap();
  const didFly = useRef(false);
  useEffect(() => {
    if (coords && !didFly.current) {
      map.setView(coords, 13);
      didFly.current = true;
    }
  }, [coords, map]);
  return null;
}

const TRAFFIC_LEVEL_LABEL = { Heavy: '🔴 Heavy', Moderate: '🟠 Moderate', Light: '🟢 Light' };

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);
  const [showTraffic, setShowTraffic] = useState(true);
  const [pinLocation, setPinLocation] = useState(null);
  const { driver } = useDriver();
  const navigate = useNavigate();
  const refreshTimer = useRef(null);

  const fetchReports = useCallback(async (lat, lng) => {
    try {
      const { data } = await getNearbyReports(lat, lng);
      setReports(data);
    } catch {}
  }, []);

  const fetchZones = useCallback(async (lat, lng) => {
    try {
      const { data } = await getTrafficZones(lat, lng);
      setZones(data);
    } catch {}
  }, []);

  const refreshAll = useCallback((lat, lng) => {
    fetchReports(lat, lng);
    fetchZones(lat, lng);
  }, [fetchReports, fetchZones]);

  useEffect(() => {
    if (!driver?._id) return;
    let watchId = null;

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos([lat, lng]);
        refreshAll(lat, lng);
        // Update driver location in DB so SOS nearby detection works
        updateLocation(driver._id, lat, lng).catch(() => {});
        // Auto-refresh zones every 60s
        refreshTimer.current = setInterval(() => refreshAll(lat, lng), 60000);
      },
      () => refreshAll(20.5937, 78.9629),
      { timeout: 10000, maximumAge: 60000 }
    );

    // Watch position and keep DB updated for SOS detection
    watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos([lat, lng]);
        updateLocation(driver._id, lat, lng).catch(() => {});
      },
      () => {},
      { timeout: 15000, maximumAge: 30000, enableHighAccuracy: false }
    );

    const socket = connectSocket(driver?._id);

    const handleAlert = (report) => {
      setReports((prev) => prev.find((r) => r._id === report._id) ? prev : [report, ...prev]);
      setAlert(report);
      setTimeout(() => setAlert(null), 5000);
      // Also refresh zones when new report arrives
      setUserPos((pos) => { if (pos) fetchZones(pos[0], pos[1]); return pos; });
    };
    const handleEmergency = (data) => {
      // Admin-level emergency — show as banner for drivers too
      setSosAlert(data);
    };
    const handleSosNearby = (data) => {
      setSosAlert(data);
    };

    socket.on('alert_nearby', handleAlert);
    socket.on('emergency_alert', handleEmergency);
    socket.on('sos_nearby', handleSosNearby);

    return () => {
      clearInterval(refreshTimer.current);
      if (watchId) navigator.geolocation?.clearWatch(watchId);
      socket.off('alert_nearby', handleAlert);
      socket.off('emergency_alert', handleEmergency);
      socket.off('sos_nearby', handleSosNearby);
    };
  }, [driver?._id, fetchZones, refreshAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const heavyCount = zones.filter((z) => z.level === 'Heavy').length;
  const moderateCount = zones.filter((z) => z.level === 'Moderate').length;
  const lightCount = zones.filter((z) => z.level === 'Light').length;

  return (
    <div className="map-wrapper">
      {/* SOS Alert Popup — full screen with alarm, map pin, acknowledge */}
      {sosAlert && (
        <SosAlertPopup
          sos={sosAlert}
          driver={driver}
          onDismiss={() => setSosAlert(null)}
        />
      )}
      {alert && (
        <div className="alert-banner">
          <span>{ISSUE_ICONS[alert.type]}</span>
          <div>
            <strong>⚠️ Alert Ahead!</strong>
            <p>{alert.type.replace(/_/g, ' ').toUpperCase()} — {alert.description}</p>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="map-controls">
        <span className="map-count">{reports.length} alerts nearby</span>
        <button
          className={`map-btn traffic-toggle ${showTraffic ? 'active' : ''}`}
          onClick={() => setShowTraffic((v) => !v)}
          title="Toggle traffic zones"
        >
          🚦 Traffic
        </button>
        <button className="map-btn" onClick={() => userPos && refreshAll(userPos[0], userPos[1])}>🔄 Refresh</button>
        <button className="map-btn report-btn" onClick={() => navigate('/report')}>+ Report Issue</button>
      </div>

      {/* Traffic legend */}
      {showTraffic && (
        <div className="traffic-legend">
          <span className="legend-title">Traffic Zones</span>
          <span className="legend-item red">🔴 Heavy ({heavyCount})</span>
          <span className="legend-item orange">🟠 Moderate ({moderateCount})</span>
          <span className="legend-item green">🟢 Light ({lightCount})</span>
        </div>
      )}

      <MapContainer
        center={userPos || [20.5937, 78.9629]}
        zoom={userPos ? 13 : 5}
        minZoom={3}
        maxZoom={19}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <ZoomControl position="bottomright" />
        {userPos && <RecenterMap coords={userPos} />}

        {/* Traffic zone circles */}
        {showTraffic && zones.map((zone, i) => (
          <Circle
            key={i}
            center={[zone.lat, zone.lng]}
            radius={800}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: 0.25,
              weight: 2,
              opacity: 0.7,
            }}
          >
            <Popup>
              <div className="popup traffic-popup">
                <strong>{TRAFFIC_LEVEL_LABEL[zone.level]} Traffic</strong>
                <p>📊 Congestion score: {zone.count}</p>
                <p>⚠️ Issues: {zone.types.map((t) => t.replace(/_/g, ' ')).join(', ')}</p>
                {zone.level === 'Heavy' && (
                  <p style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: 4 }}>
                    ⚠️ Consider an alternative route
                  </p>
                )}
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Report markers */}
        {reports.map((r) => (
          <Marker
            key={r._id}
            position={[r.location.coordinates[1], r.location.coordinates[0]]}
            icon={createIcon(r.type)}
          >
            <Popup>
              <div className="popup">
                <strong>{ISSUE_ICONS[r.type]} {r.type.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{r.description}</p>
                <small>👍 {r.upvotes} · {r.driverName}</small><br />
                <small>{new Date(r.createdAt).toLocaleString()}</small>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <button
                    className="popup-nav-btn"
                    onClick={() => setPinLocation({
                      lat: r.location.coordinates[1],
                      lng: r.location.coordinates[0],
                      title: r.type.replace(/_/g, ' ').toUpperCase(),
                      type: r.type,
                      description: r.description,
                      address: r.address,
                    })}
                  >
                    📍 View Exact Location
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${r.location.coordinates[1]},${r.location.coordinates[0]}`}
                    target="_blank" rel="noreferrer" className="popup-gmaps-btn"
                  >
                    🧭 Navigate
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Location pin modal */}
      <LocationMapModal location={pinLocation} onClose={() => setPinLocation(null)} />
    </div>
  );
}
