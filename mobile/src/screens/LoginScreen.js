import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useDriver } from '../services/DriverContext';
import { getStates } from '../services/api';

export default function LoginScreen() {
  const { register, login } = useDriver();
  const [isRegister, setIsRegister] = useState(true);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({ name: '', truckNumber: '', homeStateId: '' });
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStates().then(({ data }) => setStates(data)).catch(() => {});
  }, []);

  const handlePhoneNext = () => {
    if (!phone.trim() || phone.trim().length < 10)
      return Alert.alert('Error', 'Enter a valid phone number');
    if (isRegister) setStep('details');
    else handleLogin();
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(phone.trim(), password.trim() || undefined);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.truckNumber.trim())
      return Alert.alert('Error', 'Name and truck number are required');
    setLoading(true);
    try {
      await register(form.name.trim(), phone.trim(), form.truckNumber.trim(), form.homeStateId || undefined);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => { setStep('phone'); setPhone(''); setForm({ name: '', truckNumber: '', homeStateId: '' }); };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🚛</Text>
        <Text style={styles.title}>Truck Alert</Text>
        <Text style={styles.subtitle}>Multi-State Transport Network</Text>

        {step === 'phone' && (
          <View style={styles.toggle}>
            {['Register', 'Login'].map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.toggleBtn, (i === 0 ? isRegister : !isRegister) && styles.toggleActive]}
                onPress={() => setIsRegister(i === 0)}
              >
                <Text style={[styles.toggleText, (i === 0 ? isRegister : !isRegister) && styles.toggleTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'phone' && (
          <>
            <Text style={styles.stepLabel}>Enter your phone number</Text>
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#555"
              keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={15} />
            {!isRegister && (
              <TextInput style={styles.input} placeholder="Password (if set)" placeholderTextColor="#555"
                secureTextEntry value={password} onChangeText={setPassword} />
            )}
            <TouchableOpacity style={styles.btn} onPress={handlePhoneNext} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Please wait...' : isRegister ? 'Next' : 'Login'}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'details' && (
          <>
            <Text style={styles.stepLabel}>Complete your profile</Text>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#555"
              autoCapitalize="words" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextInput style={styles.input} placeholder="Truck Number (e.g. OD12AB1234)" placeholderTextColor="#555"
              autoCapitalize="characters" value={form.truckNumber} onChangeText={(v) => setForm({ ...form, truckNumber: v })} />

            <Text style={styles.stepLabel}>Home State (Registration State)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {states.map((s) => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.stateChip, form.homeStateId === s._id && styles.stateChipActive]}
                  onPress={() => setForm({ ...form, homeStateId: s._id })}
                >
                  <Text style={[styles.stateChipText, form.homeStateId === s._id && styles.stateChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.btnText}>Join Network</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={resetFlow}>
              <Text style={styles.linkText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.hint}>Make sure your phone and PC are on the same WiFi network.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f5a623', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24 },
  toggle: { flexDirection: 'row', backgroundColor: '#16213e', borderRadius: 10, marginBottom: 24, overflow: 'hidden' },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: '#f5a623' },
  toggleText: { color: '#aaa', fontWeight: 'bold' },
  toggleTextActive: { color: '#1a1a2e' },
  stepLabel: { color: '#aaa', fontSize: 14, marginBottom: 12, marginTop: 8 },
  input: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#0f3460',
  },
  stateChip: {
    borderWidth: 1, borderColor: '#0f3460', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: '#16213e',
  },
  stateChipActive: { backgroundColor: '#f5a623', borderColor: '#f5a623' },
  stateChipText: { color: '#aaa', fontSize: 13 },
  stateChipTextActive: { color: '#1a1a2e', fontWeight: 'bold' },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkText: { color: '#f5a623', fontSize: 13 },
  btn: { backgroundColor: '#f5a623', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  hint: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
