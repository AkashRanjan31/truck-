import React, { useEffect, useState, useCallback } from 'react';
import { getAllReportsAdmin, getAllDrivers, resolveReportWithPhoto, deleteReport, deleteDriver, adminLogin, adminChangePassword } from '../services/api';
import { connectSocket } from '../services/socket';
import LocationMapModal from '../components/LocationMapModal';
import './AdminPage.css';

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️',
};

const ISSUE_TYPES = ['all', 'police_harassment', 'extortion', 'unsafe_parking', 'accident_zone', 'poor_road', 'other'];

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('adminPass'));
  const [pass, setPass] = useState('');
  const [passErr, setPassErr] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [changeForm, setChangeForm] = useState({ current: '', next: '', confirm: '' });
  const [changeErr, setChangeErr] = useState('');
  const [changeOk, setChangeOk] = useState(false);

  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [selectedReport, setSelectedReport] = useState(null);
  const selectedReportRef = React.useRef(null);
  const setSelectedReportSafe = (r) => { selectedReportRef.current = r; setSelectedReport(r); };
  const [pinLocation, setPinLocation] = useState(null);
  const [resolveId, setResolveId] = useState(null);
  const [resolveFile, setResolveFile] = useState(null);
  const [resolvePreview, setResolvePreview] = useState(null);
  const [resolving, setResolving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, dRes] = await Promise.all([getAllReportsAdmin(), getAllDrivers()]);
      setReports(rRes.data);
      setDrivers(dRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadData();
    const socket = connectSocket();
    const handleAlert = (r) => {
      setReports((prev) => prev.find((x) => x._id === r._id) ? prev : [r, ...prev]);
      setFeed((prev) => [{ ...r, _feedTime: new Date() }, ...prev].slice(0, 20));
    };
    const handleEmergency = (d) => {
      const item = { ...d, type: '__emergency__', _feedTime: new Date() };
      setFeed((prev) => [item, ...prev].slice(0, 20));
      setSosList((prev) => [item, ...prev]);
      // Play alert sound
      try { new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg').play(); } catch {}
    };
    socket.on('alert_nearby', handleAlert);
    socket.on('emergency_alert', handleEmergency);
    socket.on('report_user_confirmed', (r) => {
      setReports((prev) => prev.map((x) => x._id === r._id ? r : x));
      if (selectedReportRef.current?._id === r._id) setSelectedReportSafe(r);
    });
    return () => {
      socket.off('alert_nearby', handleAlert);
      socket.off('emergency_alert', handleEmergency);
      socket.off('report_user_confirmed');
    };
  }, [authed, loadData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await adminLogin(pass);
      sessionStorage.setItem('adminPass', pass);
      setAuthed(true);
    } catch (err) { setPassErr(err.message); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeErr(''); setChangeOk(false);
    if (changeForm.next !== changeForm.confirm) return setChangeErr('New passwords do not match');
    try {
      await adminChangePassword(changeForm.current, changeForm.next);
      sessionStorage.setItem('adminPass', changeForm.next);
      setChangeOk(true);
      setChangeForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setShowChangePass(false); setChangeOk(false); }, 1500);
    } catch (err) { setChangeErr(err.message); }
  };

  const openResolve = (id, e) => {
    e.stopPropagation();
    setResolveId(id);
    setResolveFile(null);
    setResolvePreview(null);
    setSelectedReportSafe(null);
  };

  const handleResolveFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResolveFile(file);
    setResolvePreview(URL.createObjectURL(file));
  };

  const submitResolve = async () => {
    setResolving(true);
    try {
      const formData = new FormData();
      if (resolveFile) formData.append('resolvedPhoto', resolveFile);
      const { data } = await resolveReportWithPhoto(resolveId, formData);
      setReports((prev) => prev.map((r) => r._id === resolveId ? data : r));
      setResolveId(null);
    } catch (err) { alert('Failed to resolve: ' + err.message); }
    setResolving(false);
  };

  const handleDeleteReport = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      if (selectedReportRef.current?._id === id) setSelectedReportSafe(null);
    } catch {}
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await deleteDriver(id);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch {}
  };

  const exportCSV = () => {
    const rows = [['Type', 'Description', 'Driver', 'Phone', 'Status', 'Upvotes', 'Date']];
    filteredReports.forEach((r) => {
      rows.push([r.type, `"${r.description}"`, r.driverName, '', r.status, r.upvotes, new Date(r.createdAt).toLocaleDateString()]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'reports.csv';
    a.click();
  };

  if (!authed) {
    return (
      <div className="admin-login">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-icon">🔐</div>
          <h2>Admin Access</h2>
          <input type="password" placeholder="Admin Password" value={pass}
            onChange={(e) => setPass(e.target.value)} className="admin-input" autoFocus />
          {passErr && <p className="admin-err">{passErr}</p>}
          <button className="admin-login-btn" type="submit">Login</button>
        </form>
      </div>
    );
  }

  const activeReports = reports.filter((r) => r.status === 'active');
  const userConfirmedReports = reports.filter((r) => r.userConfirmed);
  const resolvedByAdmin = reports.filter((r) => r.status === 'resolved' && r.resolvedBy === 'admin' && !r.userConfirmed);

  const filteredReports = reports
    .filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'active') return r.status === 'active';
      if (filter === 'resolved_admin') return r.status === 'resolved' && r.resolvedBy === 'admin' && !r.userConfirmed;
      if (filter === 'user_confirmed') return r.userConfirmed === true;
      return r.status === filter;
    })
    .filter((r) => typeFilter === 'all' || r.type === typeFilter)
    .filter((r) =>
      !search ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.driverName?.toLowerCase().includes(search.toLowerCase()) ||
      r.type?.includes(search.toLowerCase())
    );

  const filteredDrivers = drivers.filter((d) =>
    !search ||
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search) ||
    d.truckNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // driver report count map
  const driverReportCount = reports.reduce((acc, r) => {
    const id = r.driverId?.toString();
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">🚛 Admin</div>
        <nav className="admin-nav">
          {[
            { key: 'reports', icon: '📋', label: 'Reports' },
            { key: 'drivers', icon: '👤', label: 'Drivers' },
            { key: 'sos', icon: '🚨', label: 'SOS Alerts' },
            { key: 'feed', icon: '⚡', label: 'Live Feed' },
          ].map((t) => (
            <button key={t.key} className={`admin-nav-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); setSearch(''); }}>
              {t.icon} {t.label}
              {t.key === 'feed' && feed.length > 0 && <span className="feed-badge">{feed.length}</span>}
              {t.key === 'sos' && sosList.length > 0 && <span className="feed-badge">{sosList.length}</span>}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => setShowChangePass(true)} style={{ marginBottom: 8 }}>
          🔑 Change Password
        </button>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem('adminPass'); setAuthed(false); }}>
          🚪 Logout
        </button>
      </aside>

      <main className="admin-main">
        {/* Stats */}
        <div className="admin-stats">
          {[
            { label: 'Total Reports', value: reports.length, color: '#f5a623' },
            { label: 'Active', value: activeReports.length, color: '#e74c3c' },
            { label: 'Resolved (Admin)', value: resolvedByAdmin.length, color: '#2ecc71' },
            { label: 'User Confirmed', value: userConfirmedReports.length, color: '#8e44ad' },
            { label: 'Drivers', value: drivers.length, color: '#3498db' },
            { label: 'SOS Today', value: sosList.length, color: '#c0392b' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <input className="admin-search"
            placeholder={tab === 'drivers' ? '🔍 Search drivers...' : '🔍 Search reports...'}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {tab === 'reports' && (
            <>
              <div className="filter-btns">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'active', label: '🔴 Active' },
                  { key: 'resolved_admin', label: '✅ Resolved (Admin)' },
                  { key: 'user_confirmed', label: '💜 User Confirmed' },
                ].map((f) => (
                  <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <select className="type-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>{t === 'all' ? 'All Types' : `${ISSUE_ICONS[t]} ${t.replace(/_/g, ' ')}`}</option>
                ))}
              </select>
              <button className="admin-refresh" onClick={exportCSV}>⬇️ CSV</button>
            </>
          )}
          <button className="admin-refresh" onClick={loadData}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Reports Tab */}
            {tab === 'reports' && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Type</th><th>Description</th><th>Driver</th>
                      <th>Location</th><th>👍</th><th>Status</th><th>Date</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 && (
                      <tr><td colSpan={8} className="empty-row">No reports found</td></tr>
                    )}
                    {filteredReports.map((r) => (
                      <React.Fragment key={r._id}>
                        <tr className={r.status === 'resolved' ? 'row-resolved' : ''}
                          style={{ cursor: 'pointer' }} onClick={() => setSelectedReportSafe(r)}>
                          <td><span className="type-cell">{ISSUE_ICONS[r.type]} {r.type.replace(/_/g, ' ')}</span></td>
                          <td className="desc-cell" title={r.description}>{r.description}</td>
                          <td>{r.driverName}</td>
                          <td className="coord-cell" onClick={(e) => e.stopPropagation()}>
                            <a href={`https://www.google.com/maps?q=${r.location?.coordinates?.[1]},${r.location?.coordinates?.[0]}`}
                              target="_blank" rel="noreferrer" className="coord-link">
                              📍 {r.address || `${r.location?.coordinates?.[1]?.toFixed(3)}, ${r.location?.coordinates?.[0]?.toFixed(3)}`}
                            </a>
                          </td>
                          <td>{r.upvotes}</td>
                          <td>
                            {r.userConfirmed
                              ? <span className="status-badge user-confirmed">💜 User Confirmed</span>
                              : r.status === 'resolved' && r.resolvedBy === 'admin'
                              ? <span className="status-badge resolved-admin">✅ Resolved (Admin)</span>
                              : r.status === 'resolved'
                              ? <span className="status-badge resolved">Resolved</span>
                              : <span className="status-badge active">Active</span>
                            }
                          </td>
                          <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                            {r.photo && <span title="Has photo" style={{ fontSize: 16 }}>📷</span>}
                            <button
                              className="btn-locate"
                              title="View Exact Location"
                              onClick={(e) => { e.stopPropagation(); setPinLocation({ lat: r.location?.coordinates?.[1], lng: r.location?.coordinates?.[0], title: r.type.replace(/_/g, ' ').toUpperCase(), type: r.type, description: r.description, address: r.address }); }}
                            >📍</button>
                            {r.status === 'active' && (
                              <button className="btn-resolve" onClick={(e) => openResolve(r._id, e)}>✅ Resolve</button>
                            )}
                            <button className="btn-delete" onClick={(e) => handleDeleteReport(r._id, e)}>🗑️</button>
                          </td>
                        </tr>

                        {/* Resolve panel */}
                        {resolveId === r._id && (
                          <tr>
                            <td colSpan={8} className="resolve-td">
                              <div className="resolve-panel">
                                <p className="resolve-panel-title">✅ Resolve — Upload Resolution Photo (optional)</p>
                                <label className="resolve-file-label">
                                  📷 {resolveFile ? resolveFile.name : 'Click to select photo'}
                                  <input type="file" accept="image/*" onChange={handleResolveFileChange} hidden />
                                </label>
                                {resolvePreview && <img src={resolvePreview} alt="preview" className="resolve-preview" />}
                                <div className="resolve-actions">
                                  <button className="btn-resolve" onClick={submitResolve} disabled={resolving}>
                                    {resolving ? 'Submitting...' : '✅ Confirm Resolve'}
                                  </button>
                                  <button className="btn-delete" onClick={() => setResolveId(null)}>✕ Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Drivers Tab */}
            {tab === 'drivers' && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Phone</th><th>Truck No.</th>
                      <th>Reports</th><th>Last Location</th><th>Status</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.length === 0 && (
                      <tr><td colSpan={8} className="empty-row">No drivers found</td></tr>
                    )}
                    {filteredDrivers.map((d) => (
                      <tr key={d._id}>
                        <td>👤 {d.name}</td>
                        <td>{d.phone}</td>
                        <td><strong>{d.truckNumber}</strong></td>
                        <td><span className="report-count">{driverReportCount[d._id] || 0}</span></td>
                        <td className="coord-cell">
                          {d.location?.coordinates?.[0] !== 0
                            ? <a href={`https://www.google.com/maps?q=${d.location.coordinates[1]},${d.location.coordinates[0]}`}
                                target="_blank" rel="noreferrer" className="coord-link">
                                📍 {d.location.coordinates[1].toFixed(3)}, {d.location.coordinates[0].toFixed(3)}
                              </a>
                            : '—'}
                        </td>
                        <td><span className={`status-badge ${d.isActive ? 'active' : 'resolved'}`}>{d.isActive ? 'active' : 'inactive'}</span></td>
                        <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="action-cell">
                          <button className="btn-delete" onClick={() => handleDeleteDriver(d._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SOS Alerts Tab */}
            {tab === 'sos' && (
              <div className="sos-list">
                {sosList.length === 0 && <p className="empty-row">No SOS alerts yet. Waiting...</p>}
                {sosList.map((item, i) => (
                  <div key={i} className="sos-card">
                    <div className="sos-card-header">
                      <span className="sos-card-icon">🚨</span>
                      <div className="sos-card-info">
                        <strong>{item.driverName} ({item.truckNumber})</strong>
                        <span>📞 {item.phone}</span>
                      </div>
                      <span className="sos-card-time">{new Date(item._feedTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="sos-card-body">
                      <p>📍 {item.address}</p>
                      {item.nearbyCount !== undefined && (
                        <p>👥 {item.nearbyCount} nearby driver{item.nearbyCount !== 1 ? 's' : ''} notified</p>
                      )}
                    </div>
                    <div className="sos-card-actions">
                      <a href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                        target="_blank" rel="noreferrer" className="sos-map-btn">
                        🗺️ View on Map
                      </a>
                      <a href={`tel:${item.phone}`} className="sos-call-btn">
                        📞 Call Driver
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Feed Tab */}
            {tab === 'feed' && (
              <div className="feed-list">
                {feed.length === 0 && <p className="empty-row">No live events yet. Waiting...</p>}
                {feed.map((item, i) => (
                  <div key={i} className={`feed-item ${item.type === '__emergency__' ? 'feed-emergency' : ''}`}>
                    <span className="feed-icon">{item.type === '__emergency__' ? '🚨' : ISSUE_ICONS[item.type]}</span>
                    <div className="feed-body">
                      {item.type === '__emergency__' ? (
                        <>
                          <strong>🚨 SOS — {item.driverName} ({item.truckNumber})</strong>
                          <p>📍 {item.address} · 📞 {item.phone}</p>
                          {item.nearbyCount !== undefined && (
                            <p style={{ color: '#e74c3c', fontSize: 11 }}>👥 {item.nearbyCount} nearby driver{item.nearbyCount !== 1 ? 's' : ''} notified</p>
                          )}
                          <a href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank" rel="noreferrer"
                            style={{ color: '#3498db', fontSize: 12, textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}>
                            🗺️ View on Map
                          </a>
                        </>
                      ) : (
                        <>
                          <strong>{item.type?.replace(/_/g, ' ').toUpperCase()} — {item.driverName}</strong>
                          <p>{item.description}</p>
                        </>
                      )}
                    </div>
                    <span className="feed-time">{new Date(item._feedTime).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showChangePass && (
        <div className="modal-overlay" onClick={() => setShowChangePass(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <button className="modal-close" onClick={() => setShowChangePass(false)}>✕</button>
            <h3 className="modal-title">🔑 Change Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <input className="admin-input" type="password" placeholder="Current password"
                value={changeForm.current} onChange={(e) => setChangeForm({ ...changeForm, current: e.target.value })} autoFocus />
              <input className="admin-input" type="password" placeholder="New password"
                value={changeForm.next} onChange={(e) => setChangeForm({ ...changeForm, next: e.target.value })} />
              <input className="admin-input" type="password" placeholder="Confirm new password"
                value={changeForm.confirm} onChange={(e) => setChangeForm({ ...changeForm, confirm: e.target.value })} />
              {changeErr && <p className="admin-err">{changeErr}</p>}
              {changeOk && <p style={{ color: '#2ecc71', fontSize: 13 }}>✅ Password changed!</p>}
              <button className="admin-login-btn" type="submit">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReportSafe(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReportSafe(null)}>✕</button>
            <h3 className="modal-title">
              {ISSUE_ICONS[selectedReport.type]} {selectedReport.type.replace(/_/g, ' ').toUpperCase()}
            </h3>

            {/* Status badge */}
            {selectedReport.userConfirmed
              ? <span className="status-badge user-confirmed" style={{ marginBottom: 16, display: 'inline-block' }}>💜 User Confirmed</span>
              : selectedReport.status === 'resolved' && selectedReport.resolvedBy === 'admin'
              ? <span className="status-badge resolved-admin" style={{ marginBottom: 16, display: 'inline-block' }}>✅ Resolved (Admin)</span>
              : <span className={`status-badge ${selectedReport.status}`} style={{ marginBottom: 16, display: 'inline-block' }}>{selectedReport.status}</span>
            }

            <div className="modal-grid">
              <div className="modal-field"><span className="mf-label">Driver</span><span className="mf-value">{selectedReport.driverName}</span></div>
              <div className="modal-field"><span className="mf-label">Upvotes</span><span className="mf-value">👍 {selectedReport.upvotes}</span></div>
              <div className="modal-field"><span className="mf-label">Reported On</span><span className="mf-value">{new Date(selectedReport.createdAt).toLocaleString()}</span></div>
              <div className="modal-field"><span className="mf-label">Location</span>
                <a className="mf-value coord-link"
                  href={`https://www.google.com/maps?q=${selectedReport.location?.coordinates?.[1]},${selectedReport.location?.coordinates?.[0]}`}
                  target="_blank" rel="noreferrer">
                  📍 {selectedReport.address || `${selectedReport.location?.coordinates?.[1]?.toFixed(5)}, ${selectedReport.location?.coordinates?.[0]?.toFixed(5)}`}
                </a>
              </div>
              {selectedReport.resolvedAt && (
                <div className="modal-field"><span className="mf-label">Resolved On</span><span className="mf-value">{new Date(selectedReport.resolvedAt).toLocaleString()}</span></div>
              )}
              {selectedReport.resolvedBy && (
                <div className="modal-field"><span className="mf-label">Resolved By</span><span className="mf-value" style={{ textTransform: 'capitalize' }}>{selectedReport.resolvedBy}</span></div>
              )}
            </div>

            {/* User confirmation block */}
            {selectedReport.userConfirmed && (
              <div className="user-confirm-block">
                <span>💜</span>
                <div>
                  <strong>User Confirmed Resolution</strong>
                  <p>{selectedReport.driverName} confirmed this issue is resolved</p>
                  <p>on {new Date(selectedReport.userConfirmedAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            <div className="modal-field" style={{ marginTop: 12 }}>
              <span className="mf-label">Description</span>
              <p className="mf-desc">{selectedReport.description}</p>
            </div>

            {selectedReport.photo && (
              <div style={{ marginTop: 16 }}>
                <p className="photo-label">📷 Driver's Photo</p>
                <img src={selectedReport.photo} alt="report" className="modal-photo" />
              </div>
            )}
            {selectedReport.resolvedPhoto && (
              <div style={{ marginTop: 12 }}>
                <p className="photo-label resolved">✅ Resolution Photo</p>
                <img src={selectedReport.resolvedPhoto} alt="resolved" className="modal-photo" />
              </div>
            )}

            <div className="modal-actions">
              {selectedReport.status === 'active' && (
                <button className="btn-resolve" onClick={(e) => openResolve(selectedReport._id, e)}>✅ Resolve</button>
              )}
              <button
                className="btn-locate-modal"
                onClick={() => setPinLocation({ lat: selectedReport.location?.coordinates?.[1], lng: selectedReport.location?.coordinates?.[0], title: selectedReport.type.replace(/_/g, ' ').toUpperCase(), type: selectedReport.type, description: selectedReport.description, address: selectedReport.address })}
              >
                📍 View Exact Location
              </button>
              <button className="btn-delete" onClick={(e) => handleDeleteReport(selectedReport._id, e)}>🗑️ Delete</button>
              <a className="map-link"
                href={`https://www.google.com/maps?q=${selectedReport.location?.coordinates?.[1]},${selectedReport.location?.coordinates?.[0]}`}
                target="_blank" rel="noreferrer">
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
      <LocationMapModal location={pinLocation} onClose={() => setPinLocation(null)} />
    </div>
  );
}
