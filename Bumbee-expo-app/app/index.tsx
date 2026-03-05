import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/colors';

export default function SplashScreen() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isLoggedIn ? '/(app)/mode-select' : '/(auth)/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  return (
    <View style={styles.container}>
      <Text style={styles.bee}>🐝</Text>
      <Text style={styles.title}>Bumbee</Text>
      <Text style={styles.tagline}>Family adventures, made magical</Text>
      <Text style={styles.footer}>© 2025 Bumbee Ltd. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  bee: { fontSize: 80, marginBottom: 16 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 40, color: Colors.primary, marginBottom: 8 },
  tagline: { fontFamily: 'Nunito_400Regular', fontSize: 18, color: Colors.secondary },
  footer: { position: 'absolute', bottom: 40, fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
});
