import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function ItinerarySetupScreen() {
  const router = useRouter();
  const { mood, ages } = useHuntStore();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      let lat, lng;
      if (mood !== 'rainy' && mood !== 'sick') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const { data } = await api.post('/itineraries/generate', { lat, lng, mood: mood || 'energetic', ages });
      router.push({ pathname: '/(app)/itinerary-view', params: { id: data.data._id, itinerary: JSON.stringify(data.data) } });
    } catch (err: any) {
      if (err.response?.data?.message === 'subscription_required') {
        Alert.alert('Subscription Required', 'Upgrade to plan more days!');
      } else {
        Alert.alert('Error', 'Could not generate itinerary');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <BeeLoader message="Building your perfect day..." />;

  const isIndoor = mood === 'rainy' || mood === 'sick';

  return (
    <View style={styles.container}>
      <BeeHeader title="Day Planner" />
      <View style={styles.content}>
        <Text style={styles.title}>{isIndoor ? '🏠 Indoor Day' : '☀️ Outdoor Day'}</Text>
        <Text style={styles.subtitle}>
          {isIndoor ? 'Looks like a cosy day — here are some indoor ideas' : "Let's plan an amazing day out!"}
        </Text>

        {isIndoor && (
          <View style={styles.checklist}>
            <Text style={styles.checkTitle}>📋 You might need:</Text>
            <Text style={styles.checkItem}>• Paper & pencils</Text>
            <Text style={styles.checkItem}>• Timer or phone</Text>
            <Text style={styles.checkItem}>• Board games</Text>
            <Text style={styles.checkItem}>• Snacks & drinks</Text>
          </View>
        )}

        <BeeButton title="🐝 Build My Day!" onPress={handleGenerate} style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary, textAlign: 'center', marginBottom: 32 },
  checklist: { backgroundColor: Colors.white, padding: 20, borderRadius: 16, marginBottom: 32 },
  checkTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 8 },
  checkItem: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 4 },
  btn: {},
});
