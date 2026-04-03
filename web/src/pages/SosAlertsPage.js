import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveSOS, acknowledgeSOS } from '../services/api';
import { connectSocket } from '../services/socket';
import { useDriver } from '../context/DriverContext';
import './SosAlertsPage.css';

function createSosIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="sp-pin-wrapper"><div class="sp-pin-pulse"></div><div class="sp-pin-marker">🆘</div></div>`,
    iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -48],
  });
}

function FlyTo({ lat, lng }) {
  const map = useMap();
  const done = React.useRef(false);
  useEffect(() => {
    if (!done.current) { map.flyTo([lat, lng], 16, { animate: true, duration: 1 }); done.current = true; }
  }, [lat, lng, map]);
  return null;
}

function StatusBadge({ sos, driverId }) {
  const acked = sos.acknowledgedBy?.find((a) => a.driverId === driverId);
  if (sos.status === 'resolved') return <span className="sp-badge sp-resolved">✅ Resolved</span>;
  if (acked) return <span className="sp-badge sp-responded">👍 Responded</span>;
  return <span className="sp-badge sp-active">🔴 Active</span>;
}

export default function SosAlertsPage() {
  const { driver } = useDriver();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [acking, setAcking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getActiveSOS();
      setAlerts(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const socket = connectSocket(driver?._id);

    // New SOS arrives — add to list
    const handleNew = (data) => {
      setAlerts((prev) => prev.find((a) => a.sosId === data.sosId) ? prev : [data, ...prev]);
    };
    // Acknowledgement update
    const handleAck = ({ sosId, driverId, driverName, truckNumber, acknowledgedAt }) => {
      setAlerts((prev) => prev.map((a) => a.sosId === sosId
        ? { ...a, acknowledgedBy: [...(a.acknowledgedBy || []), { driverId, driverName, truckNumber, acknowledgedAt }] }
        : a
      ));
      setSelected((prev) => prev?.sosId === sosId
        ? { ...prev, acknowledgedBy: [...(prev.acknowledgedBy || []), { driverId, driverName, truckNumber, acknowledgedAt }] }
        : prev
      );
    };

    socket.on('emergency_alert', handleNew);
    socket.on('sos_nearby', handleNew);
    socket.on('sos_acknowledged', handleAck);
    return () => {
      socket.off('emergency_alert', handleNew);
      socket.off('sos_nearby', handleNew);
      socket.off('sos_acknowledged', handleAck);
    };
  }, [driver?._id, load]);

  const handleAcknowledge = async (sos) => {
    setAcking(sos.sosId);
    try {
      await acknowledgeSOS(sos.sosId, { driverId: driver._id, driverName: driver.name, truckNumber: driver.truckNumber });
      setAlerts((prev) => prev.map((a) => a.sosId === sos.sosId
        ? { ...a, acknowledgedBy: [...(a.acknowledgedBy || []), { driverId: driver._id, driverName: driver.name, truckNumber: driver.truckNumber, acknowledgedAt: new Date().toISOString() }] }
        : a
      ));
      if (selected?.sosId === sos.sosId) {
        setSelected((prev) => ({ ...prev, acknowledgedBy: [...(prev.acknowledgedBy || []), { driverId: driver._id, driverName: driver.name, truckNumber: driver.truckNumber, acknowledgedAt: new Date().toISOString() }] }));
      }
    } catch {}
    setAcking(null);
  };

  const activeCount = alerts.filter((a) => a.status !== 'resolved').length;

  return (
    <div className="sp-page">
      {/* List panel */}
      <div className="sp-list">
        <div className="sp-list-header">
          <h2 className="sp-list-title">🆘 SOS Alerts</h2>
          <span className="sp-count">{activeCount} active</span>
          <button className="sp-refresh" onClick={load}>🔄</button>
        </div>

        {loading ? (
          <div className="sp-loading"><div className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <div className="sp-empty">
            <p>✅ No SOS alerts</p>
            <small>You will be notified when a nearby driver triggers SOS</small>
          </div>
        ) : (
          alerts.map((sos) => {
            const acked = sos.acknowledgedBy?.find((a) => a.driverId === driver?._id);
            const isSelected = selected?.sosId === sos.sosId;
            return (
              <div
                key={sos.sosId}
                className={`sp-card ${isSelected ? 'sp-card-selected' : ''} ${sos.status === 'resolved' ? 'sp-card-resolved' : ''}`}
                onClick={() => setSelected(isSelected ? null : sos)}
              >
                <div className="sp-card-header">
                  <span className="sp-card-icon">🚨</span>
                  <div className="sp-card-info">
                    <strong>{sos.driverName}</strong>
                    <span>{sos.truckNumber} · 📞 {sos.phone}</span>
                  </div>
                  <StatusBadge sos={sos} driverId={driver?._id} />
                </div>
                <div className="sp-card-meta">
                  <span>📍 {sos.address}</span>
                  <span>🕐 {new Date(sos.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="sp-card-meta">
                  <span className="sp-ref">ID: {sos.sosId?.slice(-8).toUpperCase()}</span>
                  <span>👥 {sos.nearbyCount} notified · ✅ {sos.acknowledgedBy?.length || 0} responded</span>
                </div>
                <div className="sp-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="sp-btn-view" onClick={() => setSelected(isSelected ? null : sos)}>
                    {isSelected ? '▲ Hide Map' : '🗺️ View Location'}
                  </button>
                  {!acked && sos.status !== 'resolved' && (
                    <button className="sp-btn-ack" onClick={() => handleAcknowledge(sos)} disabled={acking === sos.sosId}>
                      {acking === sos.sosId ? 'Responding...' : '✅ Respond'}
                    </button>
                  )}
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${sos.lat},${sos.lng}`}
                    target="_blank" rel="noreferrer" className="sp-btn-nav">🧭 Navigate</a>
                </div>

                {/* Inline map */}
                {isSelected && (
                  <div className="sp-inline-map">
                    <MapContainer center={[sos.lat, sos.lng]} zoom={14} zoomControl scrollWheelZoom
                      style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <FlyTo lat={sos.lat} lng={sos.lng} />
                      <Marker position={[sos.lat, sos.lng]} icon={createSosIcon()}>
                        <Popup>
                          <strong>🆘 {sos.driverName}</strong><br />
                          {sos.truckNumber}<br />
                          <small>{sos.address}</small><br />
                          <small>{new Date(sos.timestamp).toLocaleString()}</small>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}

                {/* Responded drivers */}
                {isSelected && sos.acknowledgedBy?.length > 0 && (
                  <div className="sp-acked-list">
                    <p className="sp-acked-title">✅ Drivers who responded:</p>
                    {sos.acknowledgedBy.map((a, i) => (
                      <span key={i} className="sp-acked-chip">
                        {a.driverName} ({a.truckNumber}) · {new Date(a.acknowledgedAt).toLocaleTimeString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
