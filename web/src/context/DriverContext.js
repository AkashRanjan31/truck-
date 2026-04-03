import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerDriver, loginDriver, setDriverId, updateLocation } from '../services/api';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Push the driver's current GPS to the backend so SOS nearby detection works.
  const pushLocation = (driverId) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        console.log(`[Location] Pushing GPS for driver ${driverId}: lat=${coords.latitude}, lng=${coords.longitude}`);
        updateLocation(driverId, coords.latitude, coords.longitude).catch(() => {});
      },
      (err) => console.warn('[Location] Could not get GPS on login:', err.message),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('driver');
      if (saved) {
        const parsed = JSON.parse(saved);
        setDriver(parsed);
        setDriverId(parsed._id);
        pushLocation(parsed._id); // restore session → refresh location
      }
    } catch {
      localStorage.removeItem('driver');
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const register = async (name, phone, truckNumber) => {
    const { data } = await registerDriver({ name, phone, truckNumber });
    setDriver(data);
    setDriverId(data._id);
    localStorage.setItem('driver', JSON.stringify(data));
    pushLocation(data._id); // new registration → capture GPS immediately
    return data;
  };

  const login = async (phone) => {
    const { data } = await loginDriver(phone);
    setDriver(data);
    setDriverId(data._id);
    localStorage.setItem('driver', JSON.stringify(data));
    pushLocation(data._id); // login → refresh GPS immediately
    return data;
  };

  const logout = () => {
    setDriver(null);
    setDriverId(null);
    localStorage.removeItem('driver');
  };

  return (
    <DriverContext.Provider value={{ driver, loading, register, login, logout }}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => useContext(DriverContext);
