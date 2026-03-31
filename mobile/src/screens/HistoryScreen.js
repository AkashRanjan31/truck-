import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Image, Linking,
} from 'react-native';
import { getDriverReports, upvoteReport, resolveReport, getAllActiveReports } from '../services/api';
import { useDriver } from '../services/DriverContext';

const ISSUE_ICONS = {
  police_harassment: '👮',
  extortion: '💰',
  unsafe_parking: '🅿️',
  accident_zone: '💥',
  poor_road: '🚧',
  other: '⚠️',
};

const STATUS_COLOR = { active: '#e74c3c', resolved: '#2ecc71' };

export default function HistoryScreen() {
  const { driver } = useDriver();
  const [tab, setTab] = useState('mine'); // 'mine' | 'all'
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = tab === 'mine'
        ? await getDriverReports(driver._id)
        : await getAllActiveReports();
      setReports(data);
    } catch {}
  }, [tab, driver._id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleUpvote = async (id) => {
    try {
      const { data } = await upvoteReport(id);
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, upvotes: data.upvotes } : r)));
    } catch {
      Alert.alert('Error', 'Could not upvote');
    }
  };

  const handleResolve = async (id) => {
    Alert.alert('Mark Resolved', 'Mark this issue as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          try {
            const { data } = await resolveReport(id);
            setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: data.status } : r)));
          } catch {
            Alert.alert('Error', 'Could not resolve');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isExpanded = expanded === item._id;
    const isOwner = item.driverId === driver._id || item.driverId?._id === driver._id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item._id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{ISSUE_ICONS[item.type]}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardType}>{item.type.replace(/_/g, ' ').toUpperCase()}</Text>
            <Text style={styles.cardMeta}>
              {item.driverName} · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            {isExpanded && item.driverPhone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.driverPhone}`)}>
                <Text style={styles.phoneLink}>📞 {item.driverPhone} (tap to call)</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc} numberOfLines={isExpanded ? undefined : 2}>
          {item.description}
        </Text>

        {item.address ? (
          <TouchableOpacity onPress={() => {
            const lat = item.location?.coordinates?.[1];
            const lng = item.location?.coordinates?.[0];
            if (lat && lng) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
          }}>
            <Text style={styles.cardAddr}>📍 {item.address}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => {
            const lat = item.location?.coordinates?.[1];
            const lng = item.location?.coordinates?.[0];
            if (lat && lng) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
          }}>
            <Text style={styles.cardAddr}>📍 {item.location?.coordinates?.[1]?.toFixed(4)}, {item.location?.coordinates?.[0]?.toFixed(4)}</Text>
          </TouchableOpacity>
        )}

        {isExpanded && item.photo && (
          <Image source={{ uri: item.photo }} style={styles.photo} resizeMode="cover" />
        )}
        {isExpanded && item.resolvedPhoto && (
          <View>
            <Text style={styles.resolvedLabel}>✅ Resolution Photo</Text>
            <Image source={{ uri: item.resolvedPhoto }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(item._id)}>
            <Text style={styles.upvoteText}>👍 {item.upvotes}</Text>
          </TouchableOpacity>

          {isOwner && item.status === 'active' && (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item._id)} disabled>
              <Text style={[styles.resolveBtnText, { opacity: 0.3 }]}>✅ Admin Only</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.expandHint}>{isExpanded ? '▲ Less' : '▼ More'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'mine' && styles.tabBtnActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>All Reports</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f5a623" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {tab === 'mine' ? 'You have no reports yet.' : 'No active reports found.'}
          </Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  tabs: { flexDirection: 'row', backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#f5a623' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#f5a623' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#0f3460',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 26, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardType: { color: '#f5a623', fontWeight: 'bold', fontSize: 13 },
  cardMeta: { color: '#888', fontSize: 11, marginTop: 2 },
  phoneLink: { color: '#2ecc71', fontSize: 11, marginTop: 4, textDecorationLine: 'underline' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { color: '#ddd', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  cardAddr: { color: '#3498db', fontSize: 12, marginBottom: 8, textDecorationLine: 'underline' },
  photo: { width: '100%', height: 180, borderRadius: 8, marginBottom: 8 },
  resolvedLabel: { color: '#2ecc71', fontSize: 12, fontWeight: 'bold', marginBottom: 4, marginTop: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  upvoteBtn: { backgroundColor: '#0f3460', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  upvoteText: { color: '#f5a623', fontSize: 13 },
  resolveBtn: { backgroundColor: '#1e3a2f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  resolveBtnText: { color: '#2ecc71', fontSize: 13 },
  expandHint: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  empty: { color: '#888', textAlign: 'center', marginTop: 80, fontSize: 15, lineHeight: 24 },
});
