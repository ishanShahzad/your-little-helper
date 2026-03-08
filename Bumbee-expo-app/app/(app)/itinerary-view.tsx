import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const reassuranceTags: Record<string, string> = {
  play: '🎯 Active play',
  craft: '✂️ Screen-free',
  outdoor: '🌿 Fresh air',
  food: '🍽️ Family meal',
  culture: '🏛️ Highly rated spot',
};

export default function ItineraryViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, itinerary: itineraryStr } = useLocalSearchParams<{ id: string; itinerary: string }>();
  const itinerary = itineraryStr ? JSON.parse(itineraryStr) : null;
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function toggleComplete(index: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  async function handleComplete() {
    try {
      await api.patch(`/itineraries/${id}/complete`);
      router.push({ pathname: '/(app)/rating', params: { mode: 'itinerary', id } });
    } catch {
      Alert.alert('Error', 'Could not complete itinerary');
    }
  }

  if (!itinerary) return null;

  const totalDuration = itinerary.totalDuration || itinerary.activities?.reduce((sum: number, a: any) => sum + (a.duration || 0), 0) || 0;
  const totalCost = itinerary.totalEstimatedCost || 0;
  const activityCount = itinerary.activities?.length || 0;

  return (
    <View style={styles.container}>
      <BeeHeader title="Your Day Plan" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* ── Summary Stats ── */}
        <View style={styles.summaryCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🕐</Text>
              <Text style={styles.statValue}>{totalDuration >= 60 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : `${totalDuration}m`}</Text>
              <Text style={styles.statLabel}>Total time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>${totalCost.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Est. cost</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>📍</Text>
              <Text style={styles.statValue}>{activityCount}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
          </View>
        </View>

        {(itinerary.activities || []).map((activity: any, i: number) => {
          const isComplete = completed.has(i);
          const tag = reassuranceTags[activity.type] || '';
          const cost = activity.estimatedCost || 0;
          const isFree = cost === 0;
          return (
            <TouchableOpacity key={i} onPress={() => toggleComplete(i)} activeOpacity={0.7}>
              <BeeCard style={[styles.activityCard, isComplete && styles.activityDone] as any}>
                <View style={styles.cardHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepText}>Step {activity.step || i + 1}</Text>
                  </View>
                  {isFree ? (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeText}>FREE</Text>
                    </View>
                  ) : (
                    <Text style={styles.costText}>${cost.toFixed(0)}</Text>
                  )}
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{activity.time || `${9 + Math.floor((i * 45) / 60)}:${String((i * 45) % 60).padStart(2, '0')}`}</Text>
                  <Text style={styles.duration}>{activity.duration || 30} min</Text>
                </View>
                <Text style={[styles.activityTitle, isComplete && styles.titleDone]}>{isComplete ? '✅ ' : ''}{activity.title}</Text>
                <Text style={styles.activityDesc}>{activity.description}</Text>
                {activity.isHome && <Text style={styles.tag}>🏠 At home</Text>}
                {activity.address && <Text style={styles.address}>📍 {activity.address}</Text>}
                {activity.googleMapsLink && (
                  <Text style={styles.mapsLink}>🗺️ Open in Maps</Text>
                )}
                {tag ? <Text style={styles.reassurance}>{tag}</Text> : null}
              </BeeCard>
            </TouchableOpacity>
          );
        })}

        <BeeButton title="✅ Complete Day" onPress={handleComplete} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 2 },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.borderLight },
  activityCard: { marginBottom: 12 },
  activityDone: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepBadge: {
    backgroundColor: Colors.backgroundAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 11, color: Colors.primary },
  freeBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 11, color: '#fff' },
  costText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: Colors.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  duration: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
  activityTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 4 },
  titleDone: { textDecorationLine: 'line-through' },
  activityDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  tag: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.green, marginTop: 8 },
  address: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  mapsLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary, marginTop: 4 },
  reassurance: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.primary, marginTop: 4, backgroundColor: Colors.backgroundAlt, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  btn: { marginTop: 12 },
});
