import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DriverProvider, useDriver } from './context/DriverContext';
import Login from './pages/Login';
import MapPage from './pages/MapPage';
import Navbar from './components/Navbar';
import './App.css';

// Lazy-load non-critical pages
const ReportPage    = lazy(() => import('./pages/ReportPage'));
const HistoryPage   = lazy(() => import('./pages/HistoryPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));
const ProfilePage   = lazy(() => import('./pages/ProfilePage'));
const SosAlertsPage = lazy(() => import('./pages/SosAlertsPage'));
const AdminPage     = lazy(() => import('./pages/AdminPage'));

const PageFallback = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', background:'var(--bg)' }}>
    <div className="spinner" />
  </div>
);

function DriverRoutes() {
  const { driver, loading } = useDriver();

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!driver) return <Login />;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Map gets its own full-height wrapper — no scroll container */}
            <Route path="/" element={<MapPage />} />
            {/* All other pages scroll inside page-body */}
            <Route path="/report"    element={<div className="page-body"><ReportPage /></div>} />
            <Route path="/history"   element={<div className="page-body"><HistoryPage /></div>} />
            <Route path="/emergency" element={<div className="page-body"><EmergencyPage /></div>} />
            <Route path="/sos-alerts" element={<div className="page-body"><SosAlertsPage /></div>} />
            <Route path="/profile"   element={<div className="page-body"><ProfilePage /></div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="*"
            element={
              <DriverProvider>
                <DriverRoutes />
              </DriverProvider>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
