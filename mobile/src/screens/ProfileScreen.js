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

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>🚛</Text>
      <Text style={styles.name}>{driver?.name}</Text>
      <Text style={styles.truck}>{driver?.truckNumber}</Text>

      <View style={styles.card}>
        {[
          ['📞 Phone', driver?.phone],
          ['🆔 Driver ID', driver?._id?.slice(-8).toUpperCase()],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Truck Alert</Text>
        <Text style={styles.about}>
          A safety network for truck drivers across India. Report issues, warn fellow drivers,
          and get help when you need it most.
        </Text>
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
  truck: { color: '#f5a623', fontSize: 16, marginTop: 4, marginBottom: 24 },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    width: '100%', marginBottom: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  rowLabel: { color: '#aaa', fontSize: 14 },
  rowValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  cardTitle: { color: '#f5a623', fontWeight: 'bold', marginBottom: 8 },
  about: { color: '#aaa', fontSize: 13, lineHeight: 20 },
  logoutBtn: {
    marginTop: 16, backgroundColor: '#e74c3c', borderRadius: 10,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
