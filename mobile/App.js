import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DriverProvider, useDriver } from './src/services/DriverContext';
import AppNavigator from './src/components/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

function RootApp() {
  const { driver, loading } = useDriver();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f5a623" />
      </View>
    );
  }

  return driver ? <AppNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DriverProvider>
        <StatusBar style="light" />
        <RootApp />
      </DriverProvider>
    </GestureHandlerRootView>
  );
}
