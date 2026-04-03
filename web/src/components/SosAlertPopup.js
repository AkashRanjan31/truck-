import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { acknowledgeSOS } from '../services/api';
import './SosAlertPopup.css';

function createSosIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="sos-pin-wrapper">
      <div class="sos-pin-pulse"></div>
      <div class="sos-pin-pulse sos-pin-pulse2"></div>
      <div class="sos-pin-marker">🆘</div>
    </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -56],
  });
}

function FlyTo({ lat, lng }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) { map.flyTo([lat, lng], 16, { animate: true, duration: 1 }); done.current = true; }
  }, [lat, lng, map]);
  return null;
}

// Beep alarm using Web Audio API — no external URL needed
function useAlarm(active) {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const beep = () => {
      try {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch {}
    };

    beep();
    intervalRef.current = setInterval(beep, 1200);

    return () => {
      clearInterval(intervalRef.current);
      if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
    };
  }, [active]);
}

export default function SosAlertPopup({ sos, driver, onDismiss }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [alarmActive, setAlarmActive] = useState(true);

  useAlarm(alarmActive);

  const handleAcknowledge = async () => {
    setAlarmActive(false);
    setAcknowledged(true);
    try {
      await acknowledgeSOS(sos.sosId, {
        driverId: driver._id,
        driverName: driver.name,
        truckNumber: driver.truckNumber,
      });
    } catch {}
  };

  const handleDismiss = () => {
    setAlarmActive(false);
    onDismiss();
  };

  if (!sos) return null;

  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${sos.lat},${sos.lng}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${sos.lat},${sos.lng}`;

  return (
    <div className="sos-popup-overlay">
      <div className={`sos-popup ${acknowledged ? 'sos-popup-acked' : 'sos-popup-active'}`}>
        {/* Header */}
        <div className="sos-popup-header">
          <span className="sos-popup-icon">🚨</span>
          <div className="sos-popup-title-wrap">
            <h2 className="sos-popup-title">{acknowledged ? 'SOS Acknowledged' : '🆘 SOS ALERT NEARBY!'}</h2>
            <p className="sos-popup-subtitle">
              {sos.driverName} ({sos.truckNumber}) needs help!
            </p>
          </div>
          {acknowledged && (
            <button className="sos-popup-close" onClick={handleDismiss}>✕</button>
          )}
        </div>

        {/* Info bar */}
        <div className="sos-popup-info">
          <span>📍 {sos.address}</span>
          <span>📞 {sos.phone}</span>
          <span>🕐 {new Date(sos.timestamp).toLocaleTimeString()}</span>
          <span className="sos-id">ID: {sos.sosId?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Map */}
        <div className="sos-popup-map">
          <MapContainer
            center={[sos.lat, sos.lng]}
            zoom={14}
            zoomControl={true}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo lat={sos.lat} lng={sos.lng} />
            <Marker position={[sos.lat, sos.lng]} icon={createSosIcon()}>
              <Popup>
                <strong>🆘 SOS Location</strong><br />
                {sos.driverName} · {sos.truckNumber}<br />
                <small>{sos.address}</small>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Actions */}
        <div className="sos-popup-actions">
          {!acknowledged ? (
            <button className="sos-ack-btn" onClick={handleAcknowledge}>
              ✅ Acknowledge & Stop Alarm
            </button>
          ) : (
            <span className="sos-acked-label">✅ You acknowledged this SOS</span>
          )}
          <a href={googleNavUrl} target="_blank" rel="noreferrer" className="sos-nav-btn">
            🧭 Navigate to SOS
          </a>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="sos-gmaps-btn">
            🗺️ Open in Google Maps
          </a>
          {acknowledged && (
            <button className="sos-dismiss-btn" onClick={handleDismiss}>Dismiss</button>
          )}
        </div>
      </div>
    </div>
  );
}
