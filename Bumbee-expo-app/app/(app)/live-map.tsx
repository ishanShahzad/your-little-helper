import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Decode Google-style encoded polyline string into coordinate array */
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

export default function LiveMapScreen() {
  const router = useRouter();
  const { currentHunt, selectedTheme, mood, ages, currentStopIndex, setHunt, completeStop } = useHuntStore();
  const [loading, setLoading] = useState(!currentHunt);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distToStop, setDistToStop] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [walkedPath, setWalkedPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const arrivedRef = useRef(false);

  useEffect(() => {
    arrivedRef.current = arrived;
  }, [arrived]);

  useEffect(() => {
    startHunt();
    return () => {
      locationSub.current?.remove();
      saveTrack();
    };
  }, []);

  // Reset arrived flag when stop changes
  useEffect(() => {
    setArrived(false);
    arrivedRef.current = false;
  }, [currentStopIndex]);

  async function saveTrack() {
    const hunt = useHuntStore.getState().currentHunt;
    if (!hunt || walkedPath.length < 2) return;
    try {
      await api.patch(`/hunts/${hunt._id}/track`, {
        walkedPath: walkedPath.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      });
    } catch {
      // silent
    }
  }

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

          // Record walked path
          setWalkedPath((prev) => [...prev, { latitude: userLat, longitude: userLng }]);

          // Calculate distance to current stop
          const hunt = useHuntStore.getState().currentHunt;
          const idx = useHuntStore.getState().currentStopIndex;
          if (hunt && hunt.stops[idx]) {
            const stop = hunt.stops[idx];
            const dist = haversineDistance(userLat, userLng, stop.lat, stop.lng);
            setDistToStop(Math.round(dist));

            if (dist < 50 && !arrivedRef.current) {
              arrivedRef.current = true;
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

  const getStopMarkerColor = useCallback((index: number) => {
    if (index < currentStopIndex) return '#4CAF50';
    if (index === currentStopIndex) return Colors.primary;
    return '#999';
  }, [currentStopIndex]);

  if (loading) return <BeeLoader message="Finding adventure spots nearby..." />;
  if (!currentHunt) return <BeeLoader message="Loading..." />;

  const stop = currentHunt.stops[currentStopIndex];
  const isLastStop = currentStopIndex >= currentHunt.stops.length - 1;

  // Decode the walking route polyline from OpenRouteService
  // If polyline exists, use it for the actual walking route; otherwise fall back to straight lines between stops
  let routeCoords: { latitude: number; longitude: number }[] = [];
  if (currentHunt.route?.polyline) {
    routeCoords = decodePolyline(currentHunt.route.polyline);
  } else {
    // Fallback: straight lines connecting stops in order
    routeCoords = currentHunt.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }));
  }

  // Initial map region centered on user or first stop
  const initialRegion = {
    latitude: location?.lat || currentHunt.stops[0]?.lat || 0,
    longitude: location?.lng || currentHunt.stops[0]?.lng || 0,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  async function handleCompleteStop() {
    try {
      await api.patch(`/hunts/${currentHunt!._id}/stop/${currentStopIndex}/complete`);
      completeStop();
      if (isLastStop) {
        await saveTrack();
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
        onPress: async () => {
          locationSub.current?.remove();
          await saveTrack();
          router.replace('/(app)/mode-select');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <BeeHeader title={`Stop ${currentStopIndex + 1}/${currentHunt.stops.length}`} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass
      >
        {/* User location blue dot */}
        {location && (
          <>
            <Circle
              center={{ latitude: location.lat, longitude: location.lng }}
              radius={12}
              fillColor="rgba(66,133,244,0.3)"
              strokeColor="rgba(66,133,244,0.6)"
              strokeWidth={1}
            />
            <Circle
              center={{ latitude: location.lat, longitude: location.lng }}
              radius={5}
              fillColor="#4285F4"
              strokeColor="#fff"
              strokeWidth={2}
            />
          </>
        )}

        {/* Stop markers */}
        {currentHunt.stops.map((s, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={i < currentStopIndex ? `✅ ${s.name}` : i === currentStopIndex ? `📍 ${s.name}` : `🔒 ${s.name}`}
            description={i === currentStopIndex ? s.clue : undefined}
            pinColor={getStopMarkerColor(i)}
          />
        ))}

        {/* Walking route polyline (gold dashed) */}
        {routeCoords.length >= 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}

        {/* Walked path polyline (green solid) */}
        {walkedPath.length >= 2 && (
          <Polyline
            coordinates={walkedPath}
            strokeColor="#4CAF50"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Distance badge */}
      {distToStop !== null && (
        <View style={styles.distBadge}>
          <Text style={styles.distText}>{distToStop}m away</Text>
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.panel}>
        <Text style={styles.stopName}>{stop?.name || 'Next Stop'}</Text>
        <Text style={styles.clue}>{stop?.clue}</Text>
        <Text style={styles.challenge}>{stop?.challenge}</Text>

        {currentHunt.weather && (
          <Text style={styles.weather}>
            🌡️ {currentHunt.weather.temp}° — {currentHunt.weather.condition || 'Clear'}
          </Text>
        )}

        {currentHunt.route?.distance > 0 && (
          <Text style={styles.routeInfo}>
            📏 {(currentHunt.route.distance / 1000).toFixed(1)} km total • ⏱️ {Math.round(currentHunt.route.duration / 60)} min walk
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
  map: { flex: 1 },
  distBadge: { position: 'absolute', top: 100, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  distText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff' },
  panel: { padding: 24, backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  stopName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  clue: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.primary, marginBottom: 8 },
  challenge: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 8 },
  weather: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 4 },
  routeInfo: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 16 },
  abandonLink: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, textAlign: 'center', marginTop: 12 },
});
