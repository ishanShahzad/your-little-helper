import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function LiveMapScreen() {
  const router = useRouter();
  const { currentHunt, selectedTheme, mood, ages, currentStopIndex, setHunt, completeStop } = useHuntStore();
  const [loading, setLoading] = useState(!currentHunt);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    startHunt();
  }, []);

  async function startHunt() {
    if (currentHunt) { setLoading(false); return; }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const { data } = await api.post('/hunts/generate', {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        theme: selectedTheme,
        mood: mood || 'energetic',
        ages,
      });
      setHunt(data.data);
    } catch (err: any) {
      if (err.response?.data?.message === 'subscription_required') {
        Alert.alert('Subscription Required', 'Upgrade to continue your adventures!');
        router.back();
      } else {
        Alert.alert('Error', 'Could not generate hunt. Please try again.');
        router.back();
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <BeeLoader message="Finding adventure spots nearby..." />;
  if (!currentHunt) return <BeeLoader message="Loading..." />;

  const stop = currentHunt.stops[currentStopIndex];
  const isLastStop = currentStopIndex >= currentHunt.stops.length - 1;

  async function handleCompleteStop() {
    try {
      await api.patch(`/hunts/${currentHunt!._id}/stop/${currentStopIndex}/complete`);
      completeStop();
      if (isLastStop) {
        await api.patch(`/hunts/${currentHunt!._id}/complete`);
        router.push('/(app)/finale');
      } else {
        router.push('/(app)/camera');
      }
    } catch {
      Alert.alert('Error', 'Could not complete stop');
    }
  }

  return (
    <View style={styles.container}>
      <BeeHeader title={`Stop ${currentStopIndex + 1}/${currentHunt.stops.length}`} />
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map View</Text>
        <Text style={styles.mapSubtext}>Map requires native build with react-native-maps</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.stopName}>{stop?.name || 'Next Stop'}</Text>
        <Text style={styles.clue}>{stop?.clue}</Text>
        <Text style={styles.challenge}>{stop?.challenge}</Text>
        <BeeButton title={isLastStop ? '🎉 Finish Hunt!' : '📸 I\'m Here!'} onPress={handleCompleteStop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8D8B8' },
  mapText: { fontSize: 48 },
  mapSubtext: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 8 },
  panel: { padding: 24, backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  stopName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  clue: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.primary, marginBottom: 8 },
  challenge: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 16 },
});
