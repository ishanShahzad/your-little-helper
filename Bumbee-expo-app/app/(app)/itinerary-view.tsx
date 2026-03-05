import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
      router.push('/(app)/rating');
    } catch {
      Alert.alert('Error', 'Could not complete itinerary');
    }
  }

  if (!itinerary) return null;

  const totalSteps = itinerary.activities?.reduce((sum: number, a: any) => sum + (a.duration || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <BeeHeader title="Your Day Plan" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.strollText}>🚶 About a {totalSteps}-minute stroll total</Text>

        {(itinerary.activities || []).map((activity: any, i: number) => {
          const isComplete = completed.has(i);
          const tag = reassuranceTags[activity.type] || '';
          return (
            <TouchableOpacity key={i} onPress={() => toggleComplete(i)} activeOpacity={0.7}>
              <BeeCard style={[styles.activityCard, isComplete && styles.activityDone]}>
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{activity.time}</Text>
                  <Text style={styles.duration}>{activity.duration} min</Text>
                </View>
                <Text style={[styles.activityTitle, isComplete && styles.titleDone]}>{isComplete ? '✅ ' : ''}{activity.title}</Text>
                <Text style={styles.activityDesc}>{activity.description}</Text>
                {activity.isHome && <Text style={styles.tag}>🏠 At home</Text>}
                {activity.address && <Text style={styles.address}>📍 {activity.address}</Text>}
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
  strollText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', marginBottom: 16 },
  activityCard: { marginBottom: 12 },
  activityDone: { opacity: 0.6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  duration: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
  activityTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 4 },
  titleDone: { textDecorationLine: 'line-through' },
  activityDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  tag: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.green, marginTop: 8 },
  address: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  reassurance: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.primary, marginTop: 4, backgroundColor: '#FFF5E0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  btn: { marginTop: 12 },
});
