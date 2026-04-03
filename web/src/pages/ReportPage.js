import React, { useState } from 'react';
import { createReport } from '../services/api';
import { emitNewReport } from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../context/DriverContext';
import './ReportPage.css';

const ISSUE_TYPES = [
  { key: 'police_harassment', label: '👮 Police Harassment' },
  { key: 'extortion', label: '💰 Roadside Extortion' },
  { key: 'unsafe_parking', label: '🅿️ Unsafe Parking' },
  { key: 'accident_zone', label: '💥 Accident Zone' },
  { key: 'poor_road', label: '🚧 Poor Road' },
  { key: 'other', label: '⚠️ Other' },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const { driver } = useDriver();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!type) return setError('Please select an issue type');
    if (!description.trim()) return setError('Please add a description');
    setError('');
    setLoading(true);

    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, maximumAge: 60000 })
      );

      const formData = new FormData();
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('lat', pos.coords.latitude);
      formData.append('lng', pos.coords.longitude);
      formData.append('driverId', driver._id);
      formData.append('driverName', driver.name);
      formData.append('driverPhone', driver.phone || '');
      if (photo) formData.append('photo', photo);

      const { data } = await createReport(formData);
      emitNewReport(data);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="report-success">
        <div className="success-icon">✅</div>
        <h2>Alert Submitted!</h2>
        <p>Nearby drivers have been notified.</p>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-card">
        <h2 className="report-title">🚨 Report an Issue</h2>

        <form onSubmit={submit}>
          <label className="field-label">Issue Type *</label>
          <div className="type-grid">
            {ISSUE_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`type-btn ${type === t.key ? 'active' : ''}`}
                onClick={() => setType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="field-label">Description *</label>
          <textarea
            className="field-input"
            placeholder="Describe the issue in detail..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <span className="char-count">{description.length}/500</span>

          <label className="field-label">Photo (optional)</label>
          <label className="photo-upload">
            📷 {photo ? photo.name : 'Click to add photo'}
            <input type="file" accept="image/*" onChange={handlePhoto} hidden />
          </label>
          {preview && (
            <div className="photo-preview-wrap">
              <img src={preview} alt="preview" className="photo-preview" />
              <button type="button" className="remove-photo" onClick={() => { setPhoto(null); setPreview(null); }}>✕ Remove</button>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : '🚨 Submit Alert'}
          </button>
        </form>
      </div>
    </div>
  );
}
