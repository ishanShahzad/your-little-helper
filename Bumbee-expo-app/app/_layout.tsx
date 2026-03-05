import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold, Nunito_400Regular, Nunito_600SemiBold });
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    requestPermissions();
  }, []);

  async function requestPermissions() {
    try {
      // Request location permissions
      const locationForeground = await Location.requestForegroundPermissionsAsync();
      if (locationForeground.status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required for this app to work properly.');
      }

      // Background location only works in development builds, not Expo Go
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (e) {
        console.log('Background location not available in Expo Go');
      }

      // Request camera permissions
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        console.log('Camera permission denied');
      }

      // Request media library permissions
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        console.log('Media library permission denied');
      }
    } catch (error) {
      console.log('Permission request error:', error);
    }
  }

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF0' } }} />
    </QueryClientProvider>
  );
}
