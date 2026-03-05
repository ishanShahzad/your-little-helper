import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function ItineraryViewScreen() {
  const router = useRouter();
  const { id, itinerary: itineraryStr } = useLocalSearchParams<{ id: string; itinerary: string }>();
  const itinerary = itineraryStr ? JSON.parse(itineraryStr) : null;

  async function handleComplete() {
    try {
      await api.patch(`/itineraries/${id}/complete`);
      router.push('/(app)/rating');
    } catch {
      Alert.alert('Error', 'Could not complete itinerary');
    }
  }

  if (!itinerary) return null;

  return (
    <View style={styles.container}>
      <BeeHeader title="Your Day Plan" />
      <ScrollView contentContainerStyle={styles.content}>
        {(itinerary.activities || []).map((activity: any, i: number) => (
          <BeeCard key={i} style={styles.activityCard}>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{activity.time}</Text>
              <Text style={styles.duration}>{activity.duration} min</Text>
            </View>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDesc}>{activity.description}</Text>
            {activity.isHome && <Text style={styles.tag}>🏠 At home</Text>}
            {activity.address && <Text style={styles.address}>📍 {activity.address}</Text>}
          </BeeCard>
        ))}

        <BeeButton title="✅ Complete Day" onPress={handleComplete} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  activityCard: { marginBottom: 12 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  duration: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
  activityTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 4 },
  activityDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  tag: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.green, marginTop: 8 },
  address: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  btn: { marginTop: 12 },
});
