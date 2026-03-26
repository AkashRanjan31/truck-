import React, { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import './Login.css';

export default function Login() {
  const { login } = useDriver();
  const [form, setForm] = useState({ name: '', phone: '', truckNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.truckNumber) return setError('All fields are required');
    setLoading(true);
    setError('');
    try {
      await login(form.name, form.phone, form.truckNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">🚛</div>
        <h1 className="login-title">Truck Alert</h1>
        <p className="login-sub">Driver Safety Network</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="login-input"
            placeholder="Phone Number"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="login-input"
            placeholder="Truck Number (e.g. MH12AB1234)"
            value={form.truckNumber}
            onChange={(e) => setForm({ ...form, truckNumber: e.target.value })}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Connecting...' : 'Join Network'}
          </button>
        </form>
      </div>
    </div>
  );
}
