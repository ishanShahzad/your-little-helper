import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold, Nunito_400Regular, Nunito_600SemiBold });
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    requestPermissions();
  }, []);

  async function requestPermissions() {
    await Location.requestForegroundPermissionsAsync();
    await Location.requestBackgroundPermissionsAsync();
    await Camera.requestCameraPermissionsAsync();
    await MediaLibrary.requestPermissionsAsync();
  }

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF0' } }} />
    </QueryClientProvider>
  );
}
