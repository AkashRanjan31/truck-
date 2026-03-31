import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getNearbyReports } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import './MapPage.css';

// Fix leaflet default icon
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
  useEffect(() => { if (coords) map.setView(coords, 12); }, [coords, map]);
  return null;
}

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const fetchReports = useCallback(async (lat, lng) => {
    try {
      const { data } = await getNearbyReports(lat, lng);
      setReports(data);
    } catch {}
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        fetchReports(pos.coords.latitude, pos.coords.longitude);
      },
      () => fetchReports(20.5937, 78.9629)
    );

    const socket = connectSocket();
    const handleAlert = (report) => {
      setReports((prev) => prev.find((r) => r._id === report._id) ? prev : [report, ...prev]);
      setAlert(report);
      setTimeout(() => setAlert(null), 5000);
    };
    const handleEmergency = (data) => {
      window.alert(`🚨 EMERGENCY!\n${data.driverName} (${data.truckNumber}) needs help!\n📍 ${data.address}`);
    };
    socket.on('alert_nearby', handleAlert);
    socket.on('emergency_alert', handleEmergency);
    return () => { socket.off('alert_nearby', handleAlert); socket.off('emergency_alert', handleEmergency); };
  }, [fetchReports]);

  return (
    <div className="map-wrapper">
      {alert && (
        <div className="alert-banner">
          <span>{ISSUE_ICONS[alert.type]}</span>
          <div>
            <strong>⚠️ Alert Ahead!</strong>
            <p>{alert.type.replace(/_/g, ' ').toUpperCase()} — {alert.description}</p>
          </div>
        </div>
      )}

      <div className="map-controls">
        <span className="map-count">{reports.length} alerts nearby</span>
        <button className="map-btn" onClick={() => userPos && fetchReports(userPos[0], userPos[1])}>🔄 Refresh</button>
        <button className="map-btn report-btn" onClick={() => navigate('/report')}>+ Report Issue</button>
      </div>

      <MapContainer
        center={userPos || [20.5937, 78.9629]}
        zoom={userPos ? 12 : 5}
        style={{ height: 'calc(100vh - 56px)', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {userPos && <RecenterMap coords={userPos} />}
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
