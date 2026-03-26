import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDriver, setDriverId } from './api';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true); // prevents flicker on startup

  useEffect(() => {
    AsyncStorage.getItem('driver')
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          setDriver(parsed);
          setDriverId(parsed._id); // restore auth header
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (name, phone, truckNumber) => {
    const { data } = await registerDriver({ name, phone, truckNumber });
    setDriver(data);
    setDriverId(data._id);
    await AsyncStorage.setItem('driver', JSON.stringify(data));
    return data;
  };

  const logout = async () => {
    setDriver(null);
    setDriverId(null);
    await AsyncStorage.removeItem('driver');
  };

  return (
    <DriverContext.Provider value={{ driver, loading, login, logout }}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => useContext(DriverContext);
