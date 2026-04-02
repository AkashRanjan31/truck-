import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { createReport } from '../services/api';
import { emitNewReport } from '../services/socket';
import { useDriver } from '../services/DriverContext';

const ISSUE_TYPES = [
  { key: 'police_harassment', label: '👮 Police Harassment' },
  { key: 'extortion', label: '💰 Roadside Extortion' },
  { key: 'unsafe_parking', label: '🅿️ Unsafe Parking' },
  { key: 'accident_zone', label: '💥 Accident Zone' },
  { key: 'poor_road', label: '🚧 Poor Road' },
  { key: 'other', label: '⚠️ Other' },
];

export default function ReportScreen({ navigation, route }) {
  const { driver } = useDriver();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const passedLocation = route.params?.location;

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled) setPhoto(result.assets[0]);
  };

  const showPhotoPicker = () => {
    Alert.alert('Add Photo', 'Choose source', [
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    if (!type) return Alert.alert('Error', 'Please select an issue type');
    if (!description.trim()) return Alert.alert('Error', 'Please add a description');

    setLoading(true);
    try {
      let coords = passedLocation;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return Alert.alert('Error', 'Location permission required');
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        coords = loc.coords;
      }

      const formData = new FormData();
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('lat', coords.latitude.toString());
      formData.append('lng', coords.longitude.toString());
      formData.append('driverId', driver._id);
      formData.append('driverName', driver.name);
      formData.append('driverPhone', driver.phone || '');

      if (photo) {
        const uri = photo.uri;
        const mimeType = photo.mimeType || (uri.endsWith('.png') ? 'image/png' : 'image/jpeg');
        const ext = mimeType.split('/')[1];
        formData.append('photo', {
          uri: uri.startsWith('file://') ? uri : `file://${uri}`,
          type: mimeType,
          name: `report.${ext}`,
        });
      }

      const { data } = await createReport(formData);
      emitNewReport(data);
      Alert.alert('✅ Reported!', 'Alert sent to nearby drivers!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Issue Type *</Text>
      <View style={styles.typeGrid}>
        {ISSUE_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
            onPress={() => setType(t.key)}
          >
            <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe the issue in detail..."
        placeholderTextColor="#888"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        maxLength={500}
      />
      <Text style={styles.charCount}>{description.length}/500</Text>

      <Text style={styles.label}>Photo (optional)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={showPhotoPicker}>
        <Text style={styles.photoBtnText}>📷 {photo ? 'Change Photo' : 'Add Photo'}</Text>
      </TouchableOpacity>

      {photo && (
        <View>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
            <Text style={styles.removePhotoText}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>🚨 Submit Alert</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20, paddingBottom: 60 },
  label: { color: '#f5a623', fontWeight: 'bold', fontSize: 14, marginBottom: 10, marginTop: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    borderWidth: 1, borderColor: '#0f3460', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#16213e',
  },
  typeBtnActive: { backgroundColor: '#f5a623', borderColor: '#f5a623' },
  typeBtnText: { color: '#aaa', fontSize: 13 },
  typeBtnTextActive: { color: '#1a1a2e', fontWeight: 'bold' },
  input: {
    backgroundColor: '#16213e', color: '#fff', borderRadius: 10,
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#0f3460',
    textAlignVertical: 'top', minHeight: 100,
  },
  charCount: { color: '#555', fontSize: 11, textAlign: 'right', marginTop: 4 },
  photoBtn: {
    borderWidth: 1, borderColor: '#0f3460', borderRadius: 10,
    padding: 14, alignItems: 'center', borderStyle: 'dashed', backgroundColor: '#16213e',
  },
  photoBtnText: { color: '#aaa', fontSize: 15 },
  preview: { width: '100%', height: 200, borderRadius: 10, marginTop: 12 },
  removePhoto: { alignSelf: 'flex-end', marginTop: 6 },
  removePhotoText: { color: '#e74c3c', fontSize: 13 },
  submitBtn: {
    backgroundColor: '#e74c3c', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
