import React, { useEffect, useState, useCallback } from 'react';
import { getDriverReports, getAllReports, upvoteReport } from '../services/api';
import { useDriver } from '../context/DriverContext';
import './HistoryPage.css';

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️',
};

export default function HistoryPage() {
  const { driver } = useDriver();
  const [tab, setTab] = useState('mine');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = tab === 'mine' ? await getDriverReports(driver._id) : await getAllReports();
      setReports(data);
    } catch {}
    setLoading(false);
  }, [tab, driver._id]);

  useEffect(() => { load(); }, [load]);

  const handleUpvote = async (id) => {
    try {
      const { data } = await upvoteReport(id);
      setReports((prev) => prev.map((r) => r._id === id ? { ...r, upvotes: data.upvotes } : r));
    } catch {}
  };

  return (
    <div className="history-page">
      <div className="history-tabs">
        <button className={`htab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>My Reports</button>
        <button className={`htab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Reports</button>
        <button className="refresh-btn" onClick={load}>🔄 Refresh</button>
      </div>

      {loading ? (
        <div style={{ padding: 40 }}><div className="spinner" /></div>
      ) : reports.length === 0 ? (
        <p className="empty-msg">{tab === 'mine' ? 'You have no reports yet.' : 'No active reports found.'}</p>
      ) : (
        <div className="report-list">
          {reports.map((r) => {
            const isExpanded = expanded === r._id;
            const isOwner = String(r.driverId) === driver._id || r.driverId?._id === driver._id;
            return (
              <div key={r._id} className="report-card" onClick={() => setExpanded(isExpanded ? null : r._id)}>
                <div className="rc-header">
                  <span className="rc-icon">{ISSUE_ICONS[r.type]}</span>
                  <div className="rc-info">
                    <strong>{r.type.replace(/_/g, ' ').toUpperCase()}</strong>
                    <span>{r.driverName} · {new Date(r.createdAt).toLocaleDateString()}</span>
                    {isExpanded && r.driverPhone && (
                      <a href={`tel:${r.driverPhone}`} style={{ color: '#2ecc71', fontSize: 11, display: 'block', marginTop: 2 }}
                        onClick={(e) => e.stopPropagation()}>📞 {r.driverPhone}</a>
                    )}
                  </div>
                  <span className={`rc-status ${r.status}`}>{r.status}</span>
                </div>

                <p className={`rc-desc ${isExpanded ? 'expanded' : ''}`}>{r.description}</p>

                <p className="rc-addr" onClick={(e) => {
                  e.stopPropagation();
                  const lat = r.location?.coordinates?.[1];
                  const lng = r.location?.coordinates?.[0];
                  if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                }}>
                  📍 {r.address || `${r.location?.coordinates?.[1]?.toFixed(4)}, ${r.location?.coordinates?.[0]?.toFixed(4)}`}
                </p>

                {isExpanded && r.photo && (
                  <img src={r.photo} alt="report" className="rc-photo" />
                )}
                {isExpanded && r.resolvedPhoto && (
                  <div>
                    <p style={{ color: '#2ecc71', fontSize: 12, margin: '8px 0 4px' }}>✅ Resolution Photo</p>
                    <img src={r.resolvedPhoto} alt="resolved" className="rc-photo" />
                  </div>
                )}

                <div className="rc-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="upvote-btn" onClick={() => handleUpvote(r._id)}>👍 {r.upvotes}</button>
                  <span className="expand-hint">{isExpanded ? '▲ Less' : '▼ More'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
