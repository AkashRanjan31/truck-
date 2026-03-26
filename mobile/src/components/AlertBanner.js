import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AlertBanner({ report }) {
  const ICONS = {
    police_harassment: '👮',
    extortion: '💰',
    unsafe_parking: '🅿️',
    accident_zone: '💥',
    poor_road: '🚧',
    other: '⚠️',
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>{ICONS[report.type]}</Text>
      <View style={styles.text}>
        <Text style={styles.title}>⚠️ Alert Ahead!</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {report.type.replace(/_/g, ' ').toUpperCase()} — {report.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#e74c3c', flexDirection: 'row', alignItems: 'center',
    padding: 12, paddingTop: 48,
  },
  icon: { fontSize: 24, marginRight: 10 },
  text: { flex: 1 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});
