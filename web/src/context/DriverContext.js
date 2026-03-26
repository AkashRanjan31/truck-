import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerDriver, setDriverId } from '../services/api';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('driver');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDriver(parsed);
      setDriverId(parsed._id);
    }
    setLoading(false);
  }, []);

  const login = async (name, phone, truckNumber) => {
    const { data } = await registerDriver({ name, phone, truckNumber });
    setDriver(data);
    setDriverId(data._id);
    localStorage.setItem('driver', JSON.stringify(data));
    return data;
  };

  const logout = () => {
    setDriver(null);
    setDriverId(null);
    localStorage.removeItem('driver');
  };

  return (
    <DriverContext.Provider value={{ driver, loading, login, logout }}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => useContext(DriverContext);
