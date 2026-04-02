import React, { useState } from 'react';
import { useDriver } from '../context/DriverContext';
import './Login.css';

export default function Login() {
  const { register, login } = useDriver();
  const [isRegister, setIsRegister] = useState(true);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [form, setForm] = useState({ name: '', truckNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneNext = (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) return setError('Enter a valid phone number');
    setError('');
    if (isRegister) setStep('details');
    else handleLogin();
  };

  const handleLogin = async () => {
    setLoading(true); setError('');
    try { await login(phone.trim()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.truckNumber.trim()) return setError('All fields are required');
    setLoading(true); setError('');
    try { await register(form.name.trim(), phone.trim(), form.truckNumber.trim()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const reset = () => { setStep('phone'); setPhone(''); setError(''); };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">🚛</div>
        <h1 className="login-title">Truck Alert</h1>
        <p className="login-sub">Driver Safety Network</p>

        {step === 'phone' && (
          <>
            <div className="login-toggle">
              <button className={`toggle-btn ${isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(true); setError(''); }}>Register</button>
              <button className={`toggle-btn ${!isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(false); setError(''); }}>Login</button>
            </div>
            <form onSubmit={handlePhoneNext} className="login-form">
              <p className="step-label">Enter your phone number</p>
              <input className="login-input" placeholder="Phone Number" type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} autoFocus />
              {error && <p className="login-error">{error}</p>}
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Please wait...' : isRegister ? 'Next' : 'Login'}
              </button>
            </form>
          </>
        )}

        {step === 'details' && (
          <form onSubmit={handleRegister} className="login-form">
            <p className="step-label">Complete your profile</p>
            <input className="login-input" placeholder="Full Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <input className="login-input" placeholder="Truck Number (e.g. MH12AB1234)"
              value={form.truckNumber} onChange={(e) => setForm({ ...form, truckNumber: e.target.value.toUpperCase() })} />
            {error && <p className="login-error">{error}</p>}
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Join Network'}
            </button>
            <div className="login-links">
              <button type="button" className="link-btn" onClick={reset}>← Change number</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
