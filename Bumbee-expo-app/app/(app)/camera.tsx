import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function CameraScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.text}>Camera viewfinder</Text>
        <Text style={styles.subtext}>Camera requires native build with expo-camera</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.captureBtn} onPress={() => router.replace('/(app)/live-map')}>
          <Text style={styles.captureBtnText}>📷 Capture & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64 },
  text: { color: '#fff', fontFamily: 'Fredoka_600SemiBold', fontSize: 18, marginTop: 12 },
  subtext: { color: '#aaa', fontFamily: 'Nunito_400Regular', fontSize: 12, marginTop: 4 },
  controls: { padding: 24, alignItems: 'center' },
  captureBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  captureBtnText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: '#fff' },
});
