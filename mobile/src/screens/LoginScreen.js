import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useDriver } from '../services/DriverContext';

export default function LoginScreen() {
  const { login } = useDriver();
  const [form, setForm] = useState({ name: '', phone: '', truckNumber: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.truckNumber.trim()) {
      return Alert.alert('Error', 'All fields are required');
    }
    setLoading(true);
    try {
      await login(form.name.trim(), form.phone.trim(), form.truckNumber.trim());
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Cannot connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', placeholder: 'Full Name', keyboard: 'default' },
    { key: 'phone', placeholder: 'Phone Number', keyboard: 'phone-pad' },
    { key: 'truckNumber', placeholder: 'Truck Number (e.g. MH12AB1234)', keyboard: 'default' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🚛</Text>
        <Text style={styles.title}>Truck Alert</Text>
        <Text style={styles.subtitle}>Driver Safety Network</Text>

        {fields.map((f) => (
          <TextInput
            key={f.key}
            style={styles.input}
            placeholder={f.placeholder}
            placeholderTextColor="#555"
            keyboardType={f.keyboard}
            autoCapitalize={f.key === 'truckNumber' ? 'characters' : 'words'}
            value={form[f.key]}
            onChangeText={(v) => setForm({ ...form, [f.key]: v })}
          />
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Connecting...' : 'Join Network'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Make sure your phone and PC are on the same WiFi network.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f5a623', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#0f3460',
  },
  btn: {
    backgroundColor: '#f5a623', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  hint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
