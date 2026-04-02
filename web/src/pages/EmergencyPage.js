import React, { useState, useRef } from 'react';
import { triggerSOS } from '../services/api';
import { useDriver } from '../context/DriverContext';
import './EmergencyPage.css';

export default function EmergencyPage() {
  const { driver } = useDriver();
  const [sent, setSent] = useState(false);
  const [notified, setNotified] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const sendEmergency = async () => {
    setError(''); setLoading(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { data } = await triggerSOS({
        driverId: driver._id,
        driverName: driver.name,
        truckNumber: driver.truckNumber,
        phone: driver.phone,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      });
      setSent(true);
      setNotified(data.notified || 0);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setSent(false); setNotified(0); }, 10000);
    } catch (err) {
      setError(err.message || 'Could not send SOS. Please enable location access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-page">
      <h2 className="em-title">Emergency Help</h2>
      <p className="em-sub">Press the button to alert the admin and all drivers within 5km of your location.</p>

      <button
        className={`sos-btn ${sent ? 'sent' : ''}`}
        onClick={sendEmergency}
        disabled={loading}
      >
        <span className="sos-icon">🆘</span>
        <span className="sos-label">{loading ? 'SENDING...' : sent ? 'ALERT SENT!' : 'EMERGENCY'}</span>
        <span className="sos-hint">{sent ? `${notified} nearby driver${notified !== 1 ? 's' : ''} notified` : 'Click to alert drivers'}</span>
      </button>

      {sent && (
        <div className="sos-result">
          🚨 SOS sent to admin + <strong>{notified}</strong> nearby driver{notified !== 1 ? 's' : ''} within 5km
        </div>
      )}

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
