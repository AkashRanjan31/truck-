import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { useDriver } from '../services/DriverContext';
import { changeDriverPassword } from '../services/api';

export default function ProfileScreen() {
  const { driver, logout } = useDriver();
  const [showChangePass, setShowChangePass] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (form.next.length < 4) return Alert.alert('Error', 'Password must be at least 4 characters');
    if (form.next !== form.confirm) return Alert.alert('Error', 'New passwords do not match');
    setSaving(true);
    try {
      await changeDriverPassword(driver._id, form.current || undefined, form.next);
      Alert.alert('✅ Success', 'Password updated successfully');
      setForm({ current: '', next: '', confirm: '' });
      setShowChangePass(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    ['📞 Phone', driver?.phone],
    ['🆔 Driver ID', driver?._id?.slice(-8).toUpperCase()],
    ['🚛 Truck', driver?.truckNumber],
    ['📅 Joined', driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '—'],
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.avatar}>🚛</Text>
      <Text style={styles.name}>{driver?.name}</Text>
      <Text style={styles.truck}>{driver?.truckNumber}</Text>

      <View style={styles.card}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.changePassBtn} onPress={() => { setShowChangePass(!showChangePass); setForm({ current: '', next: '', confirm: '' }); }}>
        <Text style={styles.changePassText}>🔑 {driver?.password ? 'Change Password' : 'Set Password'}</Text>
      </TouchableOpacity>

      {showChangePass && (
        <View style={styles.passForm}>
          {driver?.password && (
            <TextInput style={styles.passInput} placeholder="Current password" placeholderTextColor="#555"
              secureTextEntry value={form.current} onChangeText={(v) => setForm({ ...form, current: v })} />
          )}
          <TextInput style={styles.passInput} placeholder="New password (min 4 chars)" placeholderTextColor="#555"
            secureTextEntry value={form.next} onChangeText={(v) => setForm({ ...form, next: v })} />
          <TextInput style={styles.passInput} placeholder="Confirm new password" placeholderTextColor="#555"
            secureTextEntry value={form.confirm} onChangeText={(v) => setForm({ ...form, confirm: v })} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={saving}>
            {saving ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.saveBtnText}>Save Password</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  avatar: { fontSize: 72, marginTop: 20 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  truck: { color: '#f5a623', fontSize: 16, marginTop: 4, marginBottom: 24 },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    width: '100%', marginBottom: 16, borderWidth: 1, borderColor: '#0f3460',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f3460',
  },
  rowLabel: { color: '#aaa', fontSize: 14 },
  rowValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  changePassBtn: {
    width: '100%', backgroundColor: '#0f3460', borderRadius: 10,
    padding: 14, alignItems: 'center', marginBottom: 12,
  },
  changePassText: { color: '#f5a623', fontWeight: 'bold', fontSize: 14 },
  passForm: {
    width: '100%', backgroundColor: '#16213e', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#0f3460', marginBottom: 12, gap: 10,
  },
  passInput: {
    backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 8,
    padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#0f3460', marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#f5a623', borderRadius: 8,
    padding: 12, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 14 },
  logoutBtn: {
    marginTop: 8, backgroundColor: '#e74c3c', borderRadius: 10,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
