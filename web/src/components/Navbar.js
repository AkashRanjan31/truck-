import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDriver } from '../context/DriverContext';
import { connectSocket } from '../services/socket';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',           icon: '🗺️',  label: 'Live Map',   end: true },
  { to: '/report',     icon: '🚨',  label: 'Report' },
  { to: '/history',    icon: '📋',  label: 'History' },
  { to: '/emergency',  icon: '🆘',  label: 'Emergency' },
  { to: '/sos-alerts', icon: '🔔',  label: 'SOS Alerts', badge: true },
  { to: '/profile',    icon: '👤',  label: 'Profile' },
];

export default function Navbar() {
  const { driver } = useDriver();
  const navigate = useNavigate();
  const [sosBadge, setSosBadge] = useState(0);

  useEffect(() => {
    if (!driver?._id) return;
    const socket = connectSocket(driver._id);
    const inc = () => setSosBadge((n) => n + 1);
    socket.on('sos_nearby', inc);
    socket.on('emergency_alert', inc);
    return () => { socket.off('sos_nearby', inc); socket.off('emergency_alert', inc); };
  }, [driver?._id]);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        <span className="sidebar-brand-icon">🚛</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Truck Alert</span>
          <span className="sidebar-brand-sub">Safety Network</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Navigation</p>
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={() => { if (l.badge) setSosBadge(0); }}
          >
            <span className="sl-icon">{l.icon}</span>
            <span className="sl-label">{l.label}</span>
            {l.badge && sosBadge > 0 && (
              <span className="sl-badge">{sosBadge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Driver info */}
      <div className="sidebar-footer">
        <div className="sidebar-driver">
          <div className="sd-avatar">🚛</div>
          <div className="sd-info">
            <span className="sd-name">{driver?.name}</span>
            <span className="sd-truck">{driver?.truckNumber}</span>
          </div>
          <span className="sd-online" title="Online" />
        </div>
      </div>
    </aside>
  );
}
