import React from 'react';
import { useDriver } from '../context/DriverContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { driver, logout } = useDriver();

  const confirmLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) logout();
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

        <div className="about-card">
          <h4>About Truck Alert</h4>
          <p>A safety network for truck drivers. Report issues, warn fellow drivers, and get help when you need it most.</p>
        </div>

        <button className="logout-btn" onClick={confirmLogout}>Logout</button>
      </div>
    </div>
  );
}
