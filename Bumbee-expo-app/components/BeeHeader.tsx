import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

interface Props {
  title?: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
}

export function BeeHeader({ title, showBack = true, rightAction }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.titleRow}>
          <Image source={require('../assets/bumbee-logo.png')} style={styles.logoImage} />
          <Text style={styles.title} numberOfLines={1}>{title || 'Bumbee'}</Text>
        </View>

        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn} activeOpacity={0.7}>
            <Text style={styles.rightText}>{rightAction.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  logoImage: { width: 30, height: 30, borderRadius: 8 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 19, color: Colors.text },
  rightBtn: { width: 60, alignItems: 'flex-end', justifyContent: 'center' },
  rightText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
});
