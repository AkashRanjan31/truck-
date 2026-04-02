import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDriver } from '../services/DriverContext';

export default function ProfileScreen() {
  const { driver, logout } = useDriver();

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const rows = [
    ['📞 Phone', driver?.phone],
    ['🆔 Driver ID', driver?._id?.slice(-8).toUpperCase()],
    ['🏠 Home State', driver?.homeState?.name || 'Not set'],
    ['📍 Current State', driver?.currentState?.name || 'Unknown'],
    ['🚛 Truck', driver?.truckNumber],
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>🚛</Text>
      <Text style={styles.name}>{driver?.name}</Text>
      <Text style={styles.truck}>{driver?.truckNumber}</Text>

      {driver?.currentState && driver?.homeState &&
        driver.currentState._id !== driver.homeState._id && (
          <View style={styles.interstate}>
            <Text style={styles.interstateText}>
              🔄 Interstate: {driver.homeState.name} → {driver.currentState.name}
            </Text>
          </View>
        )}

      <View style={styles.card}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 24, alignItems: 'center' },
  avatar: { fontSize: 72, marginTop: 20 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  truck: { color: '#f5a623', fontSize: 16, marginTop: 4, marginBottom: 16 },
  interstate: {
    backgroundColor: '#0f3460', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 16, borderWidth: 1, borderColor: '#f5a623',
  },
  interstateText: { color: '#f5a623', fontSize: 13, fontWeight: 'bold' },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f3460',
  },
  rowLabel: { color: '#aaa', fontSize: 14 },
  rowValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    marginTop: 16, backgroundColor: '#e74c3c', borderRadius: 10,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
