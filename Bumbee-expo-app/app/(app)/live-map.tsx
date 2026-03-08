import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity, TextInput, ScrollView, Animated, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore, TaskType } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

const taskTypeIcons: Record<TaskType, string> = {
  PHOTO_TASK: '📸', COUNT_TASK: '🔢', FIND_OBJECT: '🔍',
  ANSWER_RIDDLE: '🧩', SELFIE_TASK: '🤳', CHECKIN_TASK: '📍',
};

const taskTypeLabels: Record<TaskType, string> = {
  PHOTO_TASK: 'Take a Photo', COUNT_TASK: 'Count & Answer', FIND_OBJECT: 'Find It!',
  ANSWER_RIDDLE: 'Solve the Riddle', SELFIE_TASK: 'Selfie Time!', CHECKIN_TASK: 'Check In',
};

export default function LiveMapScreen() {
  const router = useRouter();
  const { currentHunt, selectedTheme, mood, ages, durationMinutes, huntPrefs, currentStopIndex, setHunt, completeStop, resetHunt } = useHuntStore();
  const [loading, setLoading] = useState(!currentHunt);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distToStop, setDistToStop] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [walkedPath, setWalkedPath] = useState<{ latitude: number; longitude: number }[]>([]);
  const [navigationRoute, setNavigationRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [navigationInstructions, setNavigationInstructions] = useState<any[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const [showMissionPanel, setShowMissionPanel] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [countAnswer, setCountAnswer] = useState('');
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const arrivedRef = useRef(false);
  const lastRouteFetch = useRef<number>(0);

  useEffect(() => { arrivedRef.current = arrived; }, [arrived]);

  // Pulsing animation for location marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    startHunt();
    return () => { locationSub.current?.remove(); saveTrack(); };
  }, []);

  useEffect(() => {
    setArrived(false);
    arrivedRef.current = false;
    setCountAnswer('');
    setRiddleAnswer('');
    setNavigationRoute([]);
    // Fetch route to new stop immediately
    if (location && currentHunt?.stops[currentStopIndex]) {
      const s = currentHunt.stops[currentStopIndex];
      fetchNavigationRoute(location.lat, location.lng, s.lat, s.lng);
    }
  }, [currentStopIndex]);

  async function fetchNavigationRoute(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const now = Date.now();
    // Throttle: only fetch every 30 seconds
    if (now - lastRouteFetch.current < 30000 && navigationRoute.length > 0) return;
    lastRouteFetch.current = now;
    try {
      const { data } = await api.post('/hunts/route', { fromLat, fromLng, toLat, toLng });
      if (data.data?.polyline?.length >= 2) {
        setNavigationRoute(data.data.polyline);
        setRouteDistance(data.data.distance || 0);
        setRouteDuration(data.data.duration || 0);
        setNavigationInstructions(data.data.instructions || []);

        // Set current instruction (first one with distance > 0)
        if (data.data.instructions?.length > 0) {
          const nextInstruction = data.data.instructions.find((inst: any) => inst.distance > 0);
          if (nextInstruction) {
            const distanceText = nextInstruction.distance >= 1000
              ? `${(nextInstruction.distance / 1000).toFixed(1)}km`
              : `${Math.round(nextInstruction.distance)}m`;
            setCurrentInstruction(`${nextInstruction.instruction} in ${distanceText}`);
          }
        }
      }
    } catch {
      // Fallback: straight line
      setNavigationRoute([
        { latitude: fromLat, longitude: fromLng },
        { latitude: toLat, longitude: toLng },
      ]);
      setNavigationInstructions([]);
      setCurrentInstruction(null);
    }
  }

  async function saveTrack() {
    const hunt = useHuntStore.getState().currentHunt;
    if (!hunt || walkedPath.length < 2) return;
    try {
      await api.patch(`/hunts/${hunt._id}/track`, {
        walkedPath: walkedPath.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      });
    } catch { }
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
        durationMinutes,
        budget: huntPrefs.budget || 50,
        transportMode: huntPrefs.transportMode || 'walking',
        environment: huntPrefs.environment || 'mixed',
        preferences: { treasureType: huntPrefs.treasureType, eatDuring: huntPrefs.eatDuring },
      });
      setHunt(data.data);
      startTracking();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      const status = err.response?.status;
      console.error('[startHunt] Error:', status, msg, err.response?.data);
      
      if (err.isNetworkError || err.isTimeout) {
        Alert.alert(
          err.isTimeout ? 'Connection Timeout' : 'No Internet Connection',
          err.userMessage || 'Please check your internet connection and try again.',
          [{ text: 'Go back', onPress: () => router.back() }]
        );
      } else if (msg === 'subscription_required') {
        Alert.alert('Upgrade Required 🐝', 'You\'ve used your free hunt!\n\nUpgrade to Bumbee Premium for unlimited adventures.', [
          { text: 'Maybe later', onPress: () => router.back(), style: 'cancel' },
          { text: 'See Plans', onPress: () => router.back() },
        ]);
      } else if (msg.includes('only 0 suitable locations found') || msg.includes('no suitable locations')) {
        Alert.alert(
          'No Locations Found',
          'We couldn\'t find enough interesting places in your area. This might be because:\n\n• You\'re in a remote location\n• Try a different location\n• Try changing your preferences (budget, environment)\n\nWould you like to try again?',
          [
            { text: 'Go back', onPress: () => router.back(), style: 'cancel' },
            { text: 'Try Again', onPress: () => startHunt() },
          ]
        );
      } else {
        Alert.alert(
          'Hunt Generation Failed',
          msg || 'Could not create your adventure. Please try again.',
          [{ text: 'Go back', onPress: () => router.back() }],
        );
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
          setWalkedPath((prev) => [...prev, { latitude: userLat, longitude: userLng }]);

          const hunt = useHuntStore.getState().currentHunt;
          const idx = useHuntStore.getState().currentStopIndex;
          if (hunt && hunt.stops[idx]) {
            const stop = hunt.stops[idx];
            const dist = haversineDistance(userLat, userLng, stop.lat, stop.lng);
            setDistToStop(Math.round(dist));

            // Refresh navigation route every 30s while walking
            fetchNavigationRoute(userLat, userLng, stop.lat, stop.lng);

            if (dist < 50 && !arrivedRef.current) {
              arrivedRef.current = true;
              setArrived(true);
              Alert.alert(
                '🎉 You\'re here!',
                `You arrived at ${stop.name}!\n\nMission: ${stop.missionTitle}`,
                [{ text: 'Start Mission!', style: 'default' }],
              );
            }
          }
        },
      );
    } catch {
      console.log('Location tracking not available');
    }
  }

  function centerOnUser() {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.lat, longitude: location.lng,
        latitudeDelta: 0.008, longitudeDelta: 0.008,
      }, 500);
    }
  }

  const getStopMarkerColor = useCallback((index: number) => {
    const s = currentHunt?.stops[index];
    if (index < currentStopIndex) return '#4CAF50';
    if (index === currentStopIndex) return Colors.primary;
    if (s?.isFinale) return '#F5C518'; // gold for finale
    return '#999';
  }, [currentStopIndex, currentHunt]);

  async function openInMaps(link: string) {
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert('Error', 'Could not open Google Maps');
    }
  }

  if (loading) return <BeeLoader message="Generating your adventure..." />;
  if (!currentHunt) return <BeeLoader message="Loading..." />;

  const stop = currentHunt.stops[currentStopIndex];
  const isLastStop = currentStopIndex >= currentHunt.stops.length - 1;
  const taskType = (stop?.taskType || 'CHECKIN_TASK') as TaskType;
  const taskIcon = taskTypeIcons[taskType] || '📍';
  const taskLabel = taskTypeLabels[taskType] || 'Check In';

  let routeCoords: { latitude: number; longitude: number }[] = [];
  if (currentHunt.route?.polyline) {
    routeCoords = decodePolyline(currentHunt.route.polyline);
  } else {
    routeCoords = currentHunt.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }));
  }

  const initialRegion = {
    latitude: location?.lat || currentHunt.stops[0]?.lat || 0,
    longitude: location?.lng || currentHunt.stops[0]?.lng || 0,
    latitudeDelta: 0.015, longitudeDelta: 0.015,
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

  function handleTaskAction() {
    if (taskType === 'PHOTO_TASK' || taskType === 'SELFIE_TASK') {
      router.push('/(app)/camera');
    } else if (taskType === 'COUNT_TASK') {
      if (!countAnswer.trim()) {
        Alert.alert('Answer needed', 'Enter your count before continuing!');
        return;
      }
      handleCompleteStop();
    } else if (taskType === 'ANSWER_RIDDLE') {
      if (!riddleAnswer.trim()) {
        Alert.alert('Answer needed', 'Enter your answer before continuing!');
        return;
      }
      Alert.alert('🎉 Great thinking!', 'Your answer has been recorded!');
      handleCompleteStop();
    } else {
      handleCompleteStop();
    }
  }

  function handleAbandon() {
    Alert.alert('Abandon Hunt?', 'Your progress will be saved.', [
      { text: 'Keep Going!', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: async () => {
          locationSub.current?.remove();
          await saveTrack();
          resetHunt();
          router.replace('/(app)/mode-select');
        },
      },
    ]);
  }

  const canComplete = arrived || (distToStop !== null && distToStop < 50);

  return (
    <View style={styles.container}>
      <BeeHeader title={`${currentHunt.storyCharacterEmoji || '🐝'} Stop ${currentStopIndex + 1}/${currentHunt.stops.length}`} />

      <MapView
        ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion} showsUserLocation={false} showsMyLocationButton={false} showsCompass
      >
        {location && (
          <>
            {/* Animated pulsing outer circle */}
            <Animated.View
              style={{
                position: 'absolute',
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Circle
                center={{ latitude: location.lat, longitude: location.lng }}
                radius={20}
                fillColor="rgba(66,133,244,0.2)"
                strokeColor="rgba(66,133,244,0.4)"
                strokeWidth={1}
              />
            </Animated.View>
            {/* Static inner dot */}
            <Circle
              center={{ latitude: location.lat, longitude: location.lng }}
              radius={8}
              fillColor="#4285F4"
              strokeColor="#fff"
              strokeWidth={3}
            />
          </>
        )}

        {currentHunt.stops.map((s, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={i < currentStopIndex ? `✅ ${s.name}` : i === currentStopIndex ? `📍 ${s.name}` : s.isFinale ? `🏆 ${s.name}` : `🔒 Stop ${i + 1}`}
            description={i === currentStopIndex ? s.missionTitle : i < currentStopIndex ? 'Completed!' : s.isFinale ? 'Finale!' : 'Locked'}
            pinColor={getStopMarkerColor(i)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getStopMarkerColor(i) }]}>
              <Text style={styles.markerText}>{i + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Navigation route (road-following, blue) */}
        {navigationRoute.length >= 2 && (
          <Polyline coordinates={navigationRoute} strokeColor={Colors.primary} strokeWidth={5} />
        )}
        {/* Faded overall route between all stops */}
        {routeCoords.length >= 2 && (
          <Polyline coordinates={routeCoords} strokeColor={Colors.primary} strokeWidth={2} lineDashPattern={[8, 4]} strokeColors={['rgba(26,143,227,0.3)']} />
        )}
        {/* Walked path (green) */}
        {walkedPath.length >= 2 && (
          <Polyline coordinates={walkedPath} strokeColor="#4CAF50" strokeWidth={3} />
        )}
      </MapView>

      {/* Center on me button */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnText}>◎</Text>
      </TouchableOpacity>

      {/* Turn-by-turn navigation banner */}
      {currentInstruction && !arrived && (
        <View style={styles.navigationBanner}>
          <Text style={styles.navigationIcon}>🧭</Text>
          <Text style={styles.navigationText}>{currentInstruction}</Text>
        </View>
      )}

      {/* Distance & ETA badge */}
      {distToStop !== null && (
        <View style={styles.distBadge}>
          <Text style={styles.distText}>
            {distToStop < 50
              ? '✅ You\'re here!'
              : routeDistance > 0
                ? `🚶 ${routeDistance >= 1000 ? (routeDistance / 1000).toFixed(1) + 'km' : Math.round(routeDistance) + 'm'} · ${Math.max(1, Math.round(routeDuration / 60))} min`
                : `${distToStop}m away`}
          </Text>
        </View>
      )}

      {/* Map legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendLabel}>Current</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendLabel}>Done</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#999' }]} /><Text style={styles.legendLabel}>Locked</Text></View>
      </View>

      {/* Mission panel */}
      <View style={styles.panel}>
        <TouchableOpacity onPress={() => setShowMissionPanel(!showMissionPanel)} style={styles.panelHandle}>
          <View style={styles.handleBar} />
        </TouchableOpacity>

        {showMissionPanel && (
          <ScrollView style={styles.panelScroll} showsVerticalScrollIndicator={false}>
            {/* Mission type badge */}
            <View style={styles.missionBadge}>
              <Text style={styles.missionBadgeText}>{taskIcon} {taskLabel}</Text>
            </View>

            <Text style={styles.stopName}>{stop?.name || 'Next Stop'}</Text>
            {!!stop?.address && (
              <Text style={styles.stopAddress}>📍 {stop.address}</Text>
            )}
            <Text style={styles.missionTitle}>{stop?.missionTitle}</Text>

            {/* Open in Maps */}
            {!!stop?.googleMapsLink && (
              <TouchableOpacity
                style={styles.mapsBtn}
                onPress={() => openInMaps(stop.googleMapsLink!)}
              >
                <Text style={styles.mapsBtnText}>🗺️ Open in Google Maps</Text>
              </TouchableOpacity>
            )}

            {/* Clue */}
            <View style={styles.clueBox}>
              <Text style={styles.clueLabel}>💬 Clue</Text>
              <Text style={styles.clueText}>{stop?.clue}</Text>
            </View>

            {/* Task prompt */}
            <View style={styles.taskBox}>
              <Text style={styles.taskLabel}>🎯 Mission</Text>
              <Text style={styles.taskText}>{stop?.taskPrompt || stop?.challenge}</Text>
            </View>

            {/* Task-specific input */}
            {taskType === 'COUNT_TASK' && (
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Your count:</Text>
                <TextInput
                  style={styles.countInput} keyboardType="numeric" placeholder="0"
                  value={countAnswer} onChangeText={setCountAnswer} placeholderTextColor={Colors.secondary}
                />
              </View>
            )}

            {taskType === 'ANSWER_RIDDLE' && (
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Your answer:</Text>
                <TextInput
                  style={styles.riddleInput} placeholder="Type your answer..."
                  value={riddleAnswer} onChangeText={setRiddleAnswer} placeholderTextColor={Colors.secondary}
                />
              </View>
            )}

            {/* Weather & route info */}
            <View style={styles.infoRow}>
              {currentHunt.weather && (
                <Text style={styles.infoText}>🌡️ {currentHunt.weather.temp}°</Text>
              )}
              {currentHunt.route?.distance > 0 && (
                <Text style={styles.infoText}>📏 {(currentHunt.route.distance / 1000).toFixed(1)}km</Text>
              )}
              {currentHunt.route?.duration > 0 && (
                <Text style={styles.infoText}>⏱️ {Math.round(currentHunt.route.duration / 60)}min</Text>
              )}
            </View>

            {/* Action button — distance-gated */}
            {canComplete ? (
              <BeeButton
                title={isLastStop ? '🎉 Complete Hunt & Claim Treasure!' : `${taskIcon} ${taskLabel}`}
                onPress={handleTaskAction}
              />
            ) : (
              <View style={styles.walkPrompt}>
                <Text style={styles.walkIcon}>🚶</Text>
                <Text style={styles.walkText}>Walk to the stop to unlock the mission!</Text>
                <Text style={styles.walkDist}>{distToStop ? `${distToStop}m remaining` : 'Getting your location...'}</Text>
              </View>
            )}

            <Text style={styles.abandonLink} onPress={handleAbandon}>✕ Abandon Hunt</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  markerContainer: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  markerText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 13, color: '#fff' },
  centerBtn: { position: 'absolute', top: 100, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  centerBtnText: { fontSize: 22, color: Colors.primary },
  navigationBanner: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 70,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6
  },
  navigationIcon: { fontSize: 20, marginRight: 8 },
  navigationText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap'
  },
  distBadge: { position: 'absolute', top: 164, left: 16, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  distText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff' },
  legend: { position: 'absolute', top: 164, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: 8, gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: Colors.text },
  panel: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, maxHeight: height * 0.5 },
  panelHandle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  panelScroll: { paddingHorizontal: 24, paddingBottom: 24 },
  missionBadge: { alignSelf: 'flex-start', backgroundColor: Colors.backgroundAlt, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  missionBadgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary },
  stopName: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 2 },
  stopAddress: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginBottom: 6, fontStyle: 'italic' },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundAlt, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.border },
  mapsBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  missionTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 12 },
  clueBox: { backgroundColor: Colors.backgroundAlt, borderRadius: 12, padding: 14, marginBottom: 10 },
  clueLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary, marginBottom: 4 },
  clueText: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, lineHeight: 22 },
  taskBox: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  taskLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.accent, marginBottom: 4 },
  taskText: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, lineHeight: 22 },
  inputRow: { marginBottom: 12 },
  inputLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.text, marginBottom: 6 },
  countInput: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, textAlign: 'center', width: 100 },
  riddleInput: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  infoText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
  walkPrompt: { backgroundColor: Colors.backgroundAlt, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8 },
  walkIcon: { fontSize: 32, marginBottom: 4 },
  walkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  walkDist: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.primary, marginTop: 4 },
  abandonLink: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, textAlign: 'center', marginTop: 12, marginBottom: 24 },
});
