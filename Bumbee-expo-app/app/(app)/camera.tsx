import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const characterNames: Record<string, string> = {
  pirate: 'Captain Goldbeard',
  spy: 'Agent B',
  fairy: 'Sparkle',
  unicorn: 'Stardust',
  explorer: 'Scout',
};

const characterEmojis: Record<string, string> = {
  pirate: '🏴‍☠️',
  spy: '🕵️',
  fairy: '🧚',
  unicorn: '🦄',
  explorer: '🧭',
};

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { currentHunt, selectedTheme, currentStopIndex } = useHuntStore();

  const theme = selectedTheme || currentHunt?.theme || 'explorer';
  const charName = characterNames[theme] || 'Scout';
  const charEmoji = characterEmojis[theme] || '🧭';
  const isLastStop = currentHunt ? currentStopIndex >= currentHunt.stops.length - 1 : false;

  async function takePicture() {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      if (result?.uri) {
        setPhoto(result.uri);
      } else {
        Alert.alert('Error', 'Photo capture returned no image. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not take photo. Please try again.');
    }
  }

  async function handleSaveAndContinue() {
    if (!photo) return;
    setSaving(true);
    try {
      // Ensure media library permission
      if (!mediaPermission?.granted) {
        const perm = await requestMediaPermission();
        if (!perm.granted) {
          Alert.alert('Permission Needed', 'Please grant photo library access to save photos.');
          setSaving(false);
          return;
        }
      }

      // Save to device gallery
      try {
        await MediaLibrary.createAssetAsync(photo);
      } catch (saveErr) {
        console.log('Could not save to gallery:', saveErr);
        // Continue anyway — upload to server still
      }

      // Upload photo to backend
      try {
        const formData = new FormData();
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: `hunt-stop-${currentStopIndex}.jpg`,
        } as any);

        if (currentHunt?._id) {
          await api.patch(
            `/hunts/${currentHunt._id}/stop/${currentStopIndex}/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } } as any,
          );
        }
      } catch {
        console.log('Photo upload to server failed, saved locally');
      }

      // Navigate
      if (isLastStop) {
        router.replace('/(app)/finale');
      } else {
        router.replace('/(app)/live-map');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save photo. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleRetake() {
    setPhoto(null);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>We need camera access to capture your adventure moments!</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(app)/live-map')}>
          <Text style={styles.skipText}>Skip Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show captured photo with AR overlay
  if (photo) {
    return (
      <View style={styles.container}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
          <View style={styles.arOverlay}>
            <Text style={styles.arCharacter}>{charEmoji}</Text>
            <Text style={styles.arText}>{charName} was hiding here!</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Text style={styles.retakeBtnText}>🔄 Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSaveAndContinue}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : isLastStop ? '🎉 Save & Finish!' : '✅ Save & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera viewfinder
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.liveArOverlay}>
          <Text style={styles.liveArEmoji}>{charEmoji}</Text>
          <Text style={styles.liveArHint}>Tap capture to snap {charName}!</Text>
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stopLabel}>
            Stop {(currentStopIndex || 0) + 1}/{currentHunt?.stops?.length || '?'}
          </Text>
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
  stopLabel: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, color: '#fff', fontFamily: 'Nunito_600SemiBold', fontSize: 14, overflow: 'hidden' },
  liveArOverlay: { position: 'absolute', bottom: 120, left: 20, alignItems: 'center' },
  liveArEmoji: { fontSize: 64, opacity: 0.7 },
  liveArHint: { color: '#fff', fontFamily: 'Nunito_400Regular', fontSize: 12, textShadowColor: '#000', textShadowRadius: 4, marginTop: 4 },
  controls: { padding: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 20 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary },
  photoContainer: { flex: 1, position: 'relative' },
  photoPreview: { flex: 1 },
  arOverlay: { position: 'absolute', bottom: 40, left: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  arCharacter: { fontSize: 40, marginRight: 10 },
  arText: { color: '#fff', fontFamily: 'Fredoka_600SemiBold', fontSize: 16, textShadowColor: '#000', textShadowRadius: 6 },
  retakeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 26 },
  retakeBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 26 },
  saveBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: '#fff' },
  skipPhoto: { alignItems: 'center', paddingBottom: 20 },
});
