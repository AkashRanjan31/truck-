import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDriver } from '../context/DriverContext';
import './Navbar.css';

const links = [
  { to: '/', label: '🗺️ Map' },
  { to: '/report', label: '🚨 Report' },
  { to: '/history', label: '📋 History' },
  { to: '/emergency', label: '🆘 Emergency' },
  { to: '/profile', label: '👤 Profile' },
];

export default function Navbar() {
  const { driver } = useDriver();
  return (
    <nav className="navbar">
      <div className="navbar-brand">🚛 Truck Alert</div>
      <div className="navbar-links">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end={l.to === '/'}>
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="navbar-driver">{driver?.name} · {driver?.truckNumber}</div>
    </nav>
  );
}
