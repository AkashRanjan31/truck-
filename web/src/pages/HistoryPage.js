import React, { useEffect, useState, useCallback } from 'react';
import { getDriverReports, getAllReports, upvoteReport, userConfirmResolution } from '../services/api';
import { useDriver } from '../context/DriverContext';
import LocationMapModal from '../components/LocationMapModal';
import './HistoryPage.css';

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️',
};

function StatusBadge({ report }) {
  if (report.userConfirmed) return <span className="rc-status user-confirmed">✅ Confirmed by You</span>;
  if (report.status === 'resolved' && report.resolvedBy === 'admin') return <span className="rc-status resolved-admin">✅ Resolved (Admin)</span>;
  if (report.status === 'resolved') return <span className="rc-status resolved">Resolved</span>;
  return <span className="rc-status active">Active</span>;
}

export default function HistoryPage() {
  const { driver } = useDriver();
  const [tab, setTab] = useState('mine');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [pinLocation, setPinLocation] = useState(null);

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

  const handleUserConfirm = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Confirm that this issue has been resolved?')) return;
    setConfirming(id);
    try {
      const { data } = await userConfirmResolution(id);
      setReports((prev) => prev.map((r) => r._id === id ? data : r));
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirming(null);
    }
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
            const canConfirm = isOwner && !r.userConfirmed;

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
                  <StatusBadge report={r} />
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

                {isExpanded && r.photo && <img src={r.photo} alt="report" className="rc-photo" />}
                {isExpanded && r.resolvedPhoto && (
                  <div>
                    <p style={{ color: '#2ecc71', fontSize: 12, margin: '8px 0 4px' }}>✅ Resolution Photo</p>
                    <img src={r.resolvedPhoto} alt="resolved" className="rc-photo" />
                  </div>
                )}

                {/* User confirmation info */}
                {isExpanded && r.userConfirmed && r.userConfirmedAt && (
                  <div className="confirm-info">
                    ✅ You confirmed this resolved on {new Date(r.userConfirmedAt).toLocaleString()}
                  </div>
                )}

                <div className="rc-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="upvote-btn" onClick={() => handleUpvote(r._id)}>👍 {r.upvotes}</button>

                  <button
                    className="view-loc-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinLocation({
                        lat: r.location?.coordinates?.[1],
                        lng: r.location?.coordinates?.[0],
                        title: r.type.replace(/_/g, ' ').toUpperCase(),
                        type: r.type,
                        description: r.description,
                        address: r.address,
                      });
                    }}
                  >
                    📍 View Exact Location
                  </button>

                  {canConfirm && (
                    <button
                      className="confirm-btn"
                      onClick={(e) => handleUserConfirm(r._id, e)}
                      disabled={confirming === r._id}
                    >
                      {confirming === r._id ? 'Confirming...' : '✅ Issue Resolved?'}
                    </button>
                  )}

                  <span className="expand-hint">{isExpanded ? '▲ Less' : '▼ More'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LocationMapModal location={pinLocation} onClose={() => setPinLocation(null)} />
    </div>
  );
}
