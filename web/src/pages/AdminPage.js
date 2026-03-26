import React, { useEffect, useState, useCallback } from 'react';
import { getAllReportsAdmin, getAllDrivers, resolveReportWithPhoto, deleteReport, deleteDriver } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import './AdminPage.css';

const ADMIN_PASSWORD = 'admin123';

const ISSUE_ICONS = {
  police_harassment: '👮', extortion: '💰', unsafe_parking: '🅿️',
  accident_zone: '💥', poor_road: '🚧', other: '⚠️',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin') === '1');
  const [pass, setPass] = useState('');
  const [passErr, setPassErr] = useState('');

  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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
    socket.on('alert_nearby', (r) => {
      setReports((prev) => prev.find((x) => x._id === r._id) ? prev : [r, ...prev]);
      setFeed((prev) => [{ ...r, _feedTime: new Date() }, ...prev].slice(0, 20));
    });
    socket.on('emergency_alert', (d) => {
      setFeed((prev) => [{ ...d, type: '__emergency__', _feedTime: new Date() }, ...prev].slice(0, 20));
    });
    return () => { getSocket()?.off('alert_nearby'); getSocket()?.off('emergency_alert'); };
  }, [authed, loadData]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === ADMIN_PASSWORD) { sessionStorage.setItem('admin', '1'); setAuthed(true); }
    else setPassErr('Wrong password');
  };

  const openResolve = (id) => {
    setResolveId(id);
    setResolveFile(null);
    setResolvePreview(null);
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
      setResolveFile(null);
      setResolvePreview(null);
    } catch (err) {
      alert('Failed to resolve: ' + err.message);
    }
    setResolving(false);
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch {}
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await deleteDriver(id);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch {}
  };

  if (!authed) {
    return (
      <div className="admin-login">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-icon">🔐</div>
          <h2>Admin Access</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="admin-input"
            autoFocus
          />
          {passErr && <p className="admin-err">{passErr}</p>}
          <button className="admin-login-btn" type="submit">Login</button>
        </form>
      </div>
    );
  }

  const activeReports = reports.filter((r) => r.status === 'active');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');

  const filteredReports = reports
    .filter((r) => filter === 'all' || r.status === filter)
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

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">🚛 Admin</div>
        <nav className="admin-nav">
          {[
            { key: 'reports', icon: '📋', label: 'Reports' },
            { key: 'drivers', icon: '👤', label: 'Drivers' },
            { key: 'feed', icon: '⚡', label: 'Live Feed' },
          ].map((t) => (
            <button
              key={t.key}
              className={`admin-nav-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
              {t.key === 'feed' && feed.length > 0 && (
                <span className="feed-badge">{feed.length}</span>
              )}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem('admin'); setAuthed(false); }}>
          🚪 Logout
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-stats">
          {[
            { label: 'Total Reports', value: reports.length, color: '#f5a623' },
            { label: 'Active', value: activeReports.length, color: '#e74c3c' },
            { label: 'Resolved', value: resolvedReports.length, color: '#2ecc71' },
            { label: 'Drivers', value: drivers.length, color: '#3498db' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-search"
            placeholder={tab === 'drivers' ? '🔍 Search drivers...' : '🔍 Search reports...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab === 'reports' && (
            <div className="filter-btns">
              {['all', 'active', 'resolved'].map((f) => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}
          <button className="admin-refresh" onClick={loadData}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {tab === 'reports' && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Driver</th>
                      <th>Location</th>
                      <th>👍</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 && (
                      <tr><td colSpan={8} className="empty-row">No reports found</td></tr>
                    )}
                    {filteredReports.map((r) => (
                      <React.Fragment key={r._id}>
                        {/* Main row */}
                        <tr
                          className={r.status === 'resolved' ? 'row-resolved' : ''}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedRow(expandedRow === r._id ? null : r._id)}
                        >
                          <td><span className="type-cell">{ISSUE_ICONS[r.type]} {r.type.replace(/_/g, ' ')}</span></td>
                          <td className="desc-cell" title={r.description}>{r.description}</td>
                          <td>{r.driverName}</td>
                          <td className="coord-cell">
                            {r.location?.address ||
                              `${r.location?.coordinates?.[1]?.toFixed(3)}, ${r.location?.coordinates?.[0]?.toFixed(3)}`}
                          </td>
                          <td>{r.upvotes}</td>
                          <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
                          <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                            {r.photo && <span title="Has photo" style={{ fontSize: 16 }}>📷</span>}
                            {r.status === 'active' && (
                              <button className="btn-resolve" onClick={() => openResolve(r._id)}>✅ Resolve</button>
                            )}
                            <button className="btn-delete" onClick={() => handleDeleteReport(r._id)}>🗑️</button>
                          </td>
                        </tr>

                        {/* Resolve panel */}
                        {resolveId === r._id && (
                          <tr>
                            <td colSpan={8} className="resolve-td">
                              <div className="resolve-panel">
                                <p className="resolve-panel-title">✅ Resolve — Upload Resolution Photo (optional)</p>
                                <label className="resolve-file-label">
                                  📷 {resolveFile ? resolveFile.name : 'Click to select photo from device'}
                                  <input type="file" accept="image/*" onChange={handleResolveFileChange} hidden />
                                </label>
                                {resolvePreview && (
                                  <img src={resolvePreview} alt="preview" className="resolve-preview" />
                                )}
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

                        {/* Photos row */}
                        {expandedRow === r._id && (r.photo || r.resolvedPhoto) && (
                          <tr>
                            <td colSpan={8} className="photos-td">
                              <div className="photos-row">
                                {r.photo && (
                                  <div>
                                    <p className="photo-label">📷 Driver's Photo</p>
                                    <img src={r.photo} alt="report" className="report-photo" />
                                  </div>
                                )}
                                {r.resolvedPhoto && (
                                  <div>
                                    <p className="photo-label resolved">✅ Resolution Photo</p>
                                    <img src={r.resolvedPhoto} alt="resolved" className="report-photo" />
                                  </div>
                                )}
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

            {tab === 'drivers' && (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Phone</th><th>Truck No.</th>
                      <th>Last Location</th><th>Status</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.length === 0 && (
                      <tr><td colSpan={7} className="empty-row">No drivers found</td></tr>
                    )}
                    {filteredDrivers.map((d) => (
                      <tr key={d._id}>
                        <td>👤 {d.name}</td>
                        <td>{d.phone}</td>
                        <td><strong>{d.truckNumber}</strong></td>
                        <td className="coord-cell">
                          {d.location?.coordinates?.[0] !== 0
                            ? `${d.location.coordinates[1].toFixed(3)}, ${d.location.coordinates[0].toFixed(3)}`
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

            {tab === 'feed' && (
              <div className="feed-list">
                {feed.length === 0 && <p className="empty-row">No live events yet. Waiting...</p>}
                {feed.map((item, i) => (
                  <div key={i} className={`feed-item ${item.type === '__emergency__' ? 'feed-emergency' : ''}`}>
                    <span className="feed-icon">
                      {item.type === '__emergency__' ? '🚨' : ISSUE_ICONS[item.type]}
                    </span>
                    <div className="feed-body">
                      {item.type === '__emergency__' ? (
                        <>
                          <strong>EMERGENCY — {item.driverName} ({item.truckNumber})</strong>
                          <p>📍 {item.address} · 📞 {item.phone}</p>
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
    </div>
  );
}
