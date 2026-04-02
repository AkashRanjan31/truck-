import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDriver, loginDriver, setAuthToken } from './api';

const DriverContext = createContext();

export const DriverProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('driver'),
      AsyncStorage.getItem('token'),
    ]).then(([driverData, savedToken]) => {
      if (driverData && savedToken) {
        const parsed = JSON.parse(driverData);
        setDriver(parsed);
        setToken(savedToken);
        setAuthToken(savedToken);
      }
    }).finally(() => setLoading(false));
  }, []);

  const _persist = async (driverData, jwt) => {
    setDriver(driverData);
    setToken(jwt);
    setAuthToken(jwt);
    await AsyncStorage.multiSet([
      ['driver', JSON.stringify(driverData)],
      ['token', jwt],
    ]);
  };

  const register = async (name, phone, truckNumber, homeStateId) => {
    const { data } = await registerDriver({ name, phone, truckNumber, homeStateId });
    await _persist(data.driver, data.token);
    return data.driver;
  };

  const login = async (phone, password) => {
    const { data } = await loginDriver(phone, password);
    await _persist(data.driver, data.token);
    return data.driver;
  };

  const logout = async () => {
    setDriver(null);
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.multiRemove(['driver', 'token']);
  };

  return (
    <DriverContext.Provider value={{ driver, token, loading, register, login, logout }}>
      {children}
    </DriverContext.Provider>
  );
};

export const useDriver = () => useContext(DriverContext);
