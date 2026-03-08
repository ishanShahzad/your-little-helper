import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { BeeLoader } from '../../components/BeeLoader';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const THEME_EMOJIS: Record<string, string> = {
  pirate: '🏴‍☠️',
  spy: '🕵️',
  fairy: '🧚',
  unicorn: '🦄',
  explorer: '🧭',
};

const STAR_CHARS = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get('/hunts/history');
      setHistory(data.data || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) return <BeeLoader message="Loading journal..." />;

  return (
    <View style={styles.container}>
      <BeeHeader title="Family Journal" />
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>No adventures yet!</Text>
          <Text style={styles.emptySubtext}>Complete your first hunt to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const themeEmoji = item.charEmoji || THEME_EMOJIS[item.theme] || '🐝';
            const date = item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const stars = STAR_CHARS[item.rating] || '';
            return (
              <BeeCard style={styles.card}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <Text style={styles.themeEmoji}>{themeEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.theme}>{item.theme ? `${item.theme.charAt(0).toUpperCase()}${item.theme.slice(1)} Adventure` : 'Adventure'}</Text>
                    <Text style={styles.date}>{date}</Text>
                  </View>
                  {stars ? <Text style={styles.stars}>{stars}</Text> : null}
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.stopsCompleted}/{item.totalStops}</Text>
                    <Text style={styles.statLabel}>Stops</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.distanceKm > 0 ? `${item.distanceKm}km` : '—'}</Text>
                    <Text style={styles.statLabel}>Walked</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.stopsCompleted === item.totalStops ? '✅' : `${Math.round((item.stopsCompleted / Math.max(item.totalStops, 1)) * 100)}%`}</Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                </View>
              </BeeCard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 20 },
  card: { marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  themeEmoji: { fontSize: 32 },
  theme: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  date: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  stars: { fontSize: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundAlt, borderRadius: 10, paddingVertical: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.primary },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22, color: Colors.text },
  emptySubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
});
