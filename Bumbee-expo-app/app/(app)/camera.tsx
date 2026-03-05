import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const characterNames: Record<string, string> = {
  pirate: 'Captain Goldbeard', spy: 'Agent B', fairy: 'Sparkle', unicorn: 'Stardust', explorer: 'Scout',
};
const characterEmojis: Record<string, string> = {
  pirate: '🏴‍☠️', spy: '🕵️', fairy: '🧚', unicorn: '🦄', explorer: '🧭',
};
const characterTaglines: Record<string, string[]> = {
  pirate: ['Captain Goldbeard was hiding here!', 'Arrr! You found me, matey!', 'Treasure spotted! Well done!'],
  spy: ['Agent B says: mission complete!', 'You\'ve cracked the code!', 'The intel has been secured!'],
  fairy: ['Sparkle left some fairy dust for you!', 'Magic detected at this spot!', 'The enchantment is working!'],
  unicorn: ['Stardust\'s hoofprints are here!', 'Rainbow magic unlocked!', 'You found the magical trail!'],
  explorer: ['Scout says: great discovery!', 'New territory mapped!', 'An explorer\'s dream find!'],
};

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { currentHunt, selectedTheme, currentStopIndex, completeStop } = useHuntStore();

  const theme = selectedTheme || currentHunt?.theme || 'explorer';
  const charName = characterNames[theme] || 'Scout';
  const charEmoji = characterEmojis[theme] || '🧭';
  const taglines = characterTaglines[theme] || ['Great job!'];
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];
  const stop = currentHunt?.stops[currentStopIndex];
  const isLastStop = currentHunt ? currentStopIndex >= currentHunt.stops.length - 1 : false;

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      if (result?.uri) {
        setPhoto(result.uri);
        setShowCelebration(true);
        // Auto-hide celebration after 3s
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  }

  async function handleSaveAndContinue() {
    if (!photo) return;
    setSaving(true);
    try {
      if (!mediaPermission?.granted) {
        const perm = await requestMediaPermission();
        if (!perm.granted) {
          Alert.alert('Permission Needed', 'Please grant photo library access.');
          setSaving(false);
          return;
        }
      }

      try { await MediaLibrary.createAssetAsync(photo); } catch {}

      try {
        const formData = new FormData();
        formData.append('photo', { uri: photo, type: 'image/jpeg', name: `hunt-stop-${currentStopIndex}.jpg` } as any);
        if (currentHunt?._id) {
          await api.patch(`/hunts/${currentHunt._id}/stop/${currentStopIndex}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } } as any);
        }
      } catch {}

      // Complete the stop via API
      try {
        if (currentHunt?._id) {
          await api.patch(`/hunts/${currentHunt._id}/stop/${currentStopIndex}/complete`);
        }
      } catch {}

      completeStop();

      if (isLastStop) {
        if (currentHunt?._id) {
          try { await api.patch(`/hunts/${currentHunt._id}/complete`); } catch {}
        }
        router.replace('/(app)/finale');
      } else {
        router.replace('/(app)/live-map');
      }
    } catch {
      Alert.alert('Error', 'Could not save photo.');
    } finally {
      setSaving(false);
    }
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.permText}>Checking camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>We need camera access to capture your adventure moments and unlock AR characters!</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => {
          if (isLastStop) router.replace('/(app)/finale');
          else router.replace('/(app)/live-map');
        }}>
          <Text style={styles.skipText}>Skip Photo →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />

          {/* AR character overlay */}
          <View style={styles.arOverlay}>
            <Text style={styles.arCharacter}>{charEmoji}</Text>
            <View style={styles.arBubble}>
              <Text style={styles.arText}>{tagline}</Text>
            </View>
          </View>

          {/* Celebration overlay */}
          {showCelebration && (
            <View style={styles.celebrationOverlay}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationText}>Stop {currentStopIndex + 1} Complete!</Text>
              <Text style={styles.celebrationSub}>{charName} found!</Text>
            </View>
          )}
        </View>

        {/* Stop info */}
        <View style={styles.stopInfo}>
          <Text style={styles.stopInfoName}>{stop?.name || 'Adventure Stop'}</Text>
          <Text style={styles.stopInfoMission}>✅ {stop?.missionTitle || 'Mission Complete'}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
            <Text style={styles.retakeBtnText}>🔄 Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSaveAndContinue} disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : isLastStop ? '🎉 Save & Finish!' : '✅ Save & Next Stop'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.liveArOverlay}>
          <Text style={styles.liveArEmoji}>{charEmoji}</Text>
          <Text style={styles.liveArHint}>Find {charName} and tap capture!</Text>
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.stopBadge}>
            <Text style={styles.stopLabel}>Stop {(currentStopIndex || 0) + 1}/{currentHunt?.stops?.length || '?'}</Text>
          </View>
        </View>

        {/* Mission reminder */}
        <View style={styles.missionReminder}>
          <Text style={styles.missionReminderText}>{stop?.missionTitle || 'Complete the mission!'}</Text>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skipPhoto} onPress={() => {
        if (isLastStop) router.replace('/(app)/finale');
        else router.replace('/(app)/live-map');
      }}>
        <Text style={styles.skipText}>Skip Photo →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 24 },
  camera: { flex: 1 },
  icon: { fontSize: 64, marginBottom: 16 },
  permTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 22, color: Colors.text, marginBottom: 8 },
  permText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', marginBottom: 24 },
  permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 26 },
  permBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: '#fff' },
  skipBtn: { marginTop: 16 },
  skipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.secondary },
  topBar: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backText: { color: '#fff', fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  stopBadge: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  stopLabel: { color: '#fff', fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  liveArOverlay: { position: 'absolute', bottom: 140, left: 20, alignItems: 'center' },
  liveArEmoji: { fontSize: 64, opacity: 0.7 },
  liveArHint: { color: '#fff', fontFamily: 'Nunito_400Regular', fontSize: 12, textShadowColor: '#000', textShadowRadius: 4, marginTop: 4 },
  missionReminder: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  missionReminderText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff' },
  controls: { padding: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 20 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary },
  photoContainer: { flex: 1, position: 'relative' },
  photoPreview: { flex: 1 },
  arOverlay: { position: 'absolute', bottom: 80, left: 20, flexDirection: 'row', alignItems: 'flex-end' },
  arCharacter: { fontSize: 56, marginRight: 8 },
  arBubble: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, maxWidth: 200 },
  arText: { color: '#fff', fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  celebrationOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,143,227,0.3)', justifyContent: 'center', alignItems: 'center' },
  celebrationEmoji: { fontSize: 80 },
  celebrationText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: '#fff', textShadowColor: '#000', textShadowRadius: 8, marginTop: 8 },
  celebrationSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: '#fff', textShadowColor: '#000', textShadowRadius: 4 },
  stopInfo: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 8 },
  stopInfoName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  stopInfoMission: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.primaryLight },
  retakeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 26 },
  retakeBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 26 },
  saveBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: '#fff' },
  skipPhoto: { alignItems: 'center', paddingBottom: 20 },
});
