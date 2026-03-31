import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { getNearbyReports, updateLocation } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useDriver } from '../services/DriverContext';
import AlertBanner from '../components/AlertBanner';

const ISSUE_ICONS = {
  police_harassment: '👮',
  extortion: '💰',
  unsafe_parking: '🅿️',
  accident_zone: '💥',
  poor_road: '🚧',
  other: '⚠️',
};

const MARKER_COLORS = {
  police_harassment: '#e74c3c',
  extortion: '#e67e22',
  unsafe_parking: '#3498db',
  accident_zone: '#c0392b',
  poor_road: '#95a5a6',
  other: '#f39c12',
};

export default function MapScreen({ navigation }) {
  const { driver } = useDriver();
  const [location, setLocation] = useState(null);
  const [reports, setReports] = useState([]);
  const [alertBanner, setAlertBanner] = useState(null);
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);

  const fetchReports = useCallback(async (lat, lng) => {
    try {
      const { data } = await getNearbyReports(lat, lng);
      setReports(data);
    } catch {}
  }, []);

  useEffect(() => {
    let watcher = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission denied', 'Location is required to show nearby alerts.');

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      fetchReports(loc.coords.latitude, loc.coords.longitude);
      updateLocation(driver._id, loc.coords.latitude, loc.coords.longitude).catch(() => {});

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
        (newLoc) => {
          setLocation(newLoc.coords);
          updateLocation(driver._id, newLoc.coords.latitude, newLoc.coords.longitude).catch(() => {});
        }
      );
      locationWatcher.current = watcher;
    })();

    const socket = connectSocket();

    const handleAlert = (report) => {
      setReports((prev) => {
        const exists = prev.find((r) => r._id === report._id);
        return exists ? prev : [report, ...prev];
      });
      setAlertBanner(report);
      setTimeout(() => setAlertBanner(null), 5000);
    };

    const handleEmergency = (data) => {
      Alert.alert(
        '🚨 EMERGENCY ALERT',
        `${data.driverName} (${data.truckNumber}) needs help!\n📍 ${data.address}`,
        [{ text: 'OK' }]
      );
    };

    socket.on('alert_nearby', handleAlert);
    socket.on('emergency_alert', handleEmergency);

    return () => {
      locationWatcher.current?.remove();
      locationWatcher.current = null;
      socket.off('alert_nearby', handleAlert);
      socket.off('emergency_alert', handleEmergency);
    };
  }, [driver._id, fetchReports]);

  const centerOnUser = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  return (
    <View style={styles.container}>
      {alertBanner && <AlertBanner report={alertBanner} />}

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={
          location
            ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.3, longitudeDelta: 0.3 }
            : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 10, longitudeDelta: 10 }
        }
      >
        {reports.map((r) => (
          <Marker
            key={r._id}
            coordinate={{
              latitude: r.location.coordinates[1],
              longitude: r.location.coordinates[0],
            }}
          >
            <View style={[styles.markerBubble, { borderColor: MARKER_COLORS[r.type] }]}>
              <Text style={styles.markerIcon}>{ISSUE_ICONS[r.type]}</Text>
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{ISSUE_ICONS[r.type]} {r.type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.calloutDesc}>{r.description}</Text>
                <Text style={styles.calloutMeta}>👍 {r.upvotes} · by {r.driverName}</Text>
                <Text style={styles.calloutTime}>{new Date(r.createdAt).toLocaleString()}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Controls */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnText}>📍</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshBtn}
        onPress={() => location && fetchReports(location.latitude, location.longitude)}
      >
        <Text style={styles.refreshBtnText}>🔄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reportBtn}
        onPress={() => navigation.navigate('Report', { location })}
      >
        <Text style={styles.reportBtnText}>+ Report Issue</Text>
      </TouchableOpacity>

      <View style={styles.countBadge}>
        <Text style={styles.countText}>{reports.length} alerts nearby</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBubble: {
    backgroundColor: '#1a1a2e', borderRadius: 20, padding: 6,
    borderWidth: 2,
  },
  markerIcon: { fontSize: 18 },
  callout: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12,
    width: 220, borderWidth: 1, borderColor: '#f5a623',
  },
  calloutTitle: { color: '#f5a623', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  calloutDesc: { color: '#ddd', fontSize: 12, marginBottom: 4 },
  calloutMeta: { color: '#aaa', fontSize: 11, marginBottom: 2 },
  calloutTime: { color: '#666', fontSize: 10 },
  reportBtn: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: '#f5a623', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 30, elevation: 5,
  },
  reportBtnText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  centerBtn: {
    position: 'absolute', bottom: 110, right: 16,
    backgroundColor: '#16213e', width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
    borderWidth: 1, borderColor: '#0f3460',
  },
  centerBtnText: { fontSize: 20 },
  refreshBtn: {
    position: 'absolute', bottom: 170, right: 16,
    backgroundColor: '#16213e', width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
    borderWidth: 1, borderColor: '#0f3460',
  },
  refreshBtnText: { fontSize: 20 },
  countBadge: {
    position: 'absolute', top: 16, alignSelf: 'center',
    backgroundColor: 'rgba(26,26,46,0.85)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#f5a623',
  },
  countText: { color: '#f5a623', fontSize: 12, fontWeight: 'bold' },
});
