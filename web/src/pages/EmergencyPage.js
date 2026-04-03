import React, { useState, useRef } from 'react';
import { triggerSOS, updateLocation } from '../services/api';
import { useDriver } from '../context/DriverContext';
import './EmergencyPage.css';

export default function EmergencyPage() {
  const { driver } = useDriver();
  const [sent, setSent] = useState(false);
  const [notified, setNotified] = useState(0);
  const [sosId, setSosId] = useState('');
  const [sentTime, setSentTime] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const sendEmergency = async () => {
    setError(''); setLoading(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
      );
      const { latitude, longitude } = pos.coords;

      // Update own location in DB first so it's current
      await updateLocation(driver._id, latitude, longitude).catch(() => {});

      const { data } = await triggerSOS({
        driverId: driver._id,
        driverName: driver.name,
        truckNumber: driver.truckNumber,
        phone: driver.phone,
        lat: latitude,
        lng: longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
      setSent(true);
      setNotified(data.notified || 0);
      setSosId(data.sosId || '');
      setSentTime(new Date().toLocaleTimeString());
      // Log debug info to console
      if (data.debug) {
        console.log('[SOS Debug]', JSON.stringify(data.debug, null, 2));
      }
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setSent(false); setNotified(0); setSosId(''); setSentTime(null); }, 30000);
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
          <p>🚨 SOS sent to admin + <strong>{notified}</strong> nearby driver{notified !== 1 ? 's' : ''} within 5km</p>
          {sosId && <p className="sos-ref">🔖 Request ID: <strong>{sosId.slice(-8).toUpperCase()}</strong></p>}
          {sentTime && <p className="sos-ref">🕐 Sent at: <strong>{sentTime}</strong></p>}
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
