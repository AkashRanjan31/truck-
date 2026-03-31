import React, { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import { driverChangePassword } from '../services/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const { driver, logout } = useDriver();
  const [showChangePass, setShowChangePass] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const confirmLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) logout();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErr(''); setOk(false);
    if (form.next !== form.confirm) return setErr('New passwords do not match');
    if (form.next.length < 4) return setErr('Password must be at least 4 characters');
    try {
      await driverChangePassword(driver._id, form.current || undefined, form.next);
      setOk(true);
      setForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setShowChangePass(false); setOk(false); }, 1500);
    } catch (err) { setErr(err.message); }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">🚛</div>
        <h2 className="profile-name">{driver?.name}</h2>
        <p className="profile-truck">{driver?.truckNumber}</p>

        <div className="profile-info">
          {[
            ['📞 Phone', driver?.phone],
            ['🆔 Driver ID', driver?._id?.slice(-8).toUpperCase()],
            ['📅 Joined', driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '—'],
          ].map(([label, value]) => (
            <div key={label} className="info-row">
              <span className="info-label">{label}</span>
              <span className="info-value">{value}</span>
            </div>
          ))}
        </div>

        <button className="change-pass-btn" onClick={() => { setShowChangePass(!showChangePass); setErr(''); setOk(false); }}>
          🔑 {driver?.password ? 'Change Password' : 'Set Password'}
        </button>

        {showChangePass && (
          <form className="change-pass-form" onSubmit={handleChangePassword}>
            {driver?.password && (
              <input className="pass-input" type="password" placeholder="Current password"
                value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            )}
            <input className="pass-input" type="password" placeholder="New password"
              value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
            <input className="pass-input" type="password" placeholder="Confirm new password"
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            {err && <p className="pass-err">{err}</p>}
            {ok && <p className="pass-ok">✅ Password updated!</p>}
            <button className="pass-submit-btn" type="submit">Save Password</button>
          </form>
        )}

        <div className="about-card">
          <h4>About Truck Alert</h4>
          <p>A safety network for truck drivers. Report issues, warn fellow drivers, and get help when you need it most.</p>
        </div>

        <button className="logout-btn" onClick={confirmLogout}>Logout</button>
      </div>
    </div>
  );
}
