import React, { useState, useRef } from 'react';
import { emitEmergency } from '../services/socket';
import { useDriver } from '../context/DriverContext';
import './EmergencyPage.css';

export default function EmergencyPage() {
  const { driver } = useDriver();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const sendEmergency = async () => {
    setError('');
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      emitEmergency({
        driverId: driver._id,
        driverName: driver.name,
        truckNumber: driver.truckNumber,
        phone: driver.phone,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        timestamp: new Date().toISOString(),
      });
      setSent(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSent(false), 10000);
    } catch {
      setError('Could not get location. Please enable location access.');
    }
  };

  return (
    <div className="emergency-page">
      <h2 className="em-title">Emergency Help</h2>
      <p className="em-sub">Press the button to alert ALL drivers and broadcast your location instantly.</p>

      <button
        className={`sos-btn ${sent ? 'sent' : ''}`}
        onClick={sendEmergency}
      >
        <span className="sos-icon">🆘</span>
        <span className="sos-label">{sent ? 'ALERT SENT!' : 'EMERGENCY'}</span>
        <span className="sos-hint">{sent ? 'Help is on the way' : 'Click to alert drivers'}</span>
      </button>

      {error && <p className="em-error">{error}</p>}

      <div className="em-info-card">
        <h4>Your Info</h4>
        <p>🚛 {driver?.truckNumber}</p>
        <p>👤 {driver?.name}</p>
        <p>📞 {driver?.phone}</p>
      </div>

      <div className="em-tips-card">
        <h4>Safety Tips</h4>
        {[
          'Stay calm and stay in your truck',
          'Lock your doors if threatened',
          'Note badge numbers of officers',
          'Record video if safe to do so',
        ].map((tip, i) => <p key={i}>• {tip}</p>)}
      </div>
    </div>
  );
}
