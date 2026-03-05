import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveMapScreen() {
  const router = useRouter();
  const { currentHunt, selectedTheme, mood, ages, currentStopIndex, setHunt, completeStop } = useHuntStore();
  const [loading, setLoading] = useState(!currentHunt);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distToStop, setDistToStop] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    startHunt();
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  async function startHunt() {
    if (currentHunt) {
      setLoading(false);
      startTracking();
      return;
    }
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
      startTracking();
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

  async function startTracking() {
    try {
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const userLat = loc.coords.latitude;
          const userLng = loc.coords.longitude;
          setLocation({ lat: userLat, lng: userLng });

          // Calculate distance to current stop
          const hunt = useHuntStore.getState().currentHunt;
          const idx = useHuntStore.getState().currentStopIndex;
          if (hunt && hunt.stops[idx]) {
            const stop = hunt.stops[idx];
            const dist = haversineDistance(userLat, userLng, stop.lat, stop.lng);
            setDistToStop(Math.round(dist));

            if (dist < 50 && !arrived) {
              setArrived(true);
              Alert.alert('🎉 You\'re here!', `You arrived at ${stop.name}!`, [
                { text: '📸 Take Photo', onPress: () => handleCompleteStop() },
              ]);
            }
          }
        },
      );
    } catch {
      console.log('Location tracking not available');
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

  function handleAbandon() {
    Alert.alert('Abandon Hunt?', 'Are you sure you want to end this adventure?', [
      { text: 'Keep Going!', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => {
          locationSub.current?.remove();
          router.replace('/(app)/mode-select');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <BeeHeader title={`Stop ${currentStopIndex + 1}/${currentHunt.stops.length}`} />

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️</Text>
        <Text style={styles.mapLabel}>Map View</Text>
        <Text style={styles.mapSubtext}>Full map requires react-native-maps native build</Text>

        {/* Stop indicators */}
        <View style={styles.stopsRow}>
          {currentHunt.stops.map((s, i) => (
            <View
              key={i}
              style={[
                styles.stopDot,
                i < currentStopIndex && styles.stopCompleted,
                i === currentStopIndex && styles.stopCurrent,
                i > currentStopIndex && styles.stopLocked,
              ]}
            >
              <Text style={styles.stopDotText}>
                {i < currentStopIndex ? '✅' : i === currentStopIndex ? '📍' : '🔒'}
              </Text>
            </View>
          ))}
        </View>

        {distToStop !== null && (
          <View style={styles.distBadge}>
            <Text style={styles.distText}>{distToStop}m away</Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.stopName}>{stop?.name || 'Next Stop'}</Text>
        <Text style={styles.clue}>{stop?.clue}</Text>
        <Text style={styles.challenge}>{stop?.challenge}</Text>

        {currentHunt.weather && (
          <Text style={styles.weather}>
            🌡️ {currentHunt.weather.temp}° — {currentHunt.weather.condition || 'Clear'}
          </Text>
        )}

        <BeeButton title={isLastStop ? '🎉 Finish Hunt!' : "📸 I'm Here!"} onPress={handleCompleteStop} />
        <Text style={styles.abandonLink} onPress={handleAbandon}>Abandon Hunt</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8D8B8' },
  mapText: { fontSize: 64 },
  mapLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginTop: 8 },
  mapSubtext: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  stopsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  stopDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stopCompleted: { backgroundColor: Colors.green },
  stopCurrent: { backgroundColor: Colors.primary },
  stopLocked: { backgroundColor: Colors.grey },
  stopDotText: { fontSize: 18 },
  distBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  distText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff' },
  panel: { padding: 24, backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  stopName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  clue: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.primary, marginBottom: 8 },
  challenge: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 8 },
  weather: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 16 },
  abandonLink: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, textAlign: 'center', marginTop: 12 },
});
