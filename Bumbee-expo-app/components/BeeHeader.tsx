import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

interface Props {
  title?: string;
  showBack?: boolean;
}

export function BeeHeader({ title, showBack = true }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backBtn} />
      )}
      <View style={styles.logoRow}>
        <Image source={require('../assets/bumbee-logo.png')} style={styles.logoImage} />
        <Text style={styles.logo}>{title || 'Bumbee'}</Text>
      </View>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white },
  backBtn: { width: 40 },
  backText: { fontSize: 24, color: Colors.primary },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 32, height: 32, borderRadius: 8 },
  logo: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.primary },
});
