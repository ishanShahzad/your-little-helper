import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { BeeLoader } from '../../components/BeeLoader';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function JournalScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const { data } = await api.get('/users/me/history');
      setHistory(data.data || []);
    } catch {} finally {
      setLoading(false);
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
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BeeCard style={styles.card}>
              <Text style={styles.theme}>{item.theme} adventure</Text>
              <Text style={styles.date}>{new Date(item.completedAt).toLocaleDateString()}</Text>
              {item.rating && <Text style={styles.rating}>{'⭐'.repeat(item.rating)}</Text>}
            </BeeCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 24 },
  card: { marginBottom: 12 },
  theme: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, textTransform: 'capitalize' },
  date: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  rating: { marginTop: 4, fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text },
  emptySubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
});
