import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DriverProvider, useDriver } from './context/DriverContext';
import Login from './pages/Login';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import EmergencyPage from './pages/EmergencyPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';

function DriverRoutes() {
  const { driver, loading } = useDriver();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!driver) return <Login />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin is completely separate — no driver auth needed */}
        <Route path="/admin" element={<AdminPage />} />
        {/* All other routes go through driver auth */}
        <Route
          path="*"
          element={
            <DriverProvider>
              <DriverRoutes />
            </DriverProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
