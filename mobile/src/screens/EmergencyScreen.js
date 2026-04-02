import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Animated } from 'react-native';
import * as Location from 'expo-location';
import { triggerSOS } from '../services/api';
import { useDriver } from '../services/DriverContext';

export default function EmergencyScreen() {
  const { driver } = useDriver();
  const [sent, setSent] = useState(false);
  const [notified, setNotified] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const sendEmergency = async () => {
    Vibration.vibrate([0, 500, 200, 500]);
    pulse();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Location permission required');

      const loc = await Location.getCurrentPositionAsync({});
      const { data } = await triggerSOS({
        driverId: driver._id,
        driverName: driver.name,
        truckNumber: driver.truckNumber,
        phone: driver.phone,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        address: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
      });

      setSent(true);
      setNotified(data.notified || 0);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setSent(false); setNotified(0); }, 10000);
    } catch {
      Alert.alert('Error', 'Could not send emergency alert. Check your connection.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Help</Text>
      <Text style={styles.subtitle}>
        Press the button to alert ALL nearby drivers and dispatch your location instantly.
      </Text>

      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={[styles.emergencyBtn, sent && styles.emergencyBtnSent]}
          onPress={sendEmergency}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyIcon}>🆘</Text>
          <Text style={styles.emergencyText}>{sent ? 'ALERT SENT!' : 'EMERGENCY'}</Text>
          <Text style={styles.emergencySubText}>{sent ? `${notified} drivers notified` : 'Tap to alert drivers'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {sent && (
        <View style={styles.notifBadge}>
          <Text style={styles.notifText}>🚨 SOS sent to admin + {notified} nearby driver{notified !== 1 ? 's' : ''} within 5km</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Your Info</Text>
        <Text style={styles.infoText}>🚛 {driver?.truckNumber}</Text>
        <Text style={styles.infoText}>👤 {driver?.name}</Text>
        <Text style={styles.infoText}>📞 {driver?.phone}</Text>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Safety Tips</Text>
        {[
          'Stay calm and stay in your truck',
          'Lock your doors if threatened',
          'Note badge numbers of officers',
          'Record video if safe to do so',
        ].map((tip, i) => <Text key={i} style={styles.tip}>• {tip}</Text>)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center' },
  title: { color: '#f5a623', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 40, lineHeight: 20 },
  emergencyBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#e74c3c', alignItems: 'center', justifyContent: 'center',
    borderWidth: 6, borderColor: '#c0392b', elevation: 10,
  },
  emergencyBtnSent: { backgroundColor: '#2ecc71', borderColor: '#27ae60' },
  emergencyIcon: { fontSize: 48 },
  emergencyText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginTop: 4 },
  emergencySubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  notifBadge: {
    backgroundColor: 'rgba(231,76,60,0.15)', borderWidth: 1, borderColor: '#e74c3c',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 20,
  },
  notifText: { color: '#e74c3c', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  infoCard: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    width: '100%', marginTop: 20, borderWidth: 1, borderColor: '#0f3460',
  },
  infoTitle: { color: '#f5a623', fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: '#ddd', fontSize: 14, marginBottom: 4 },
  tipsCard: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    width: '100%', marginTop: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  tipsTitle: { color: '#f5a623', fontWeight: 'bold', marginBottom: 8 },
  tip: { color: '#aaa', fontSize: 13, marginBottom: 4, lineHeight: 20 },
});
