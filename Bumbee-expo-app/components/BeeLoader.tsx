import React from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  message?: string;
}

export function BeeLoader({ message = 'Loading...' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={require('../assets/bumbee-logo.png')} style={styles.logo} />
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
          ))}
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24, padding: 32,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
    borderWidth: 1, borderColor: Colors.borderLight,
    minWidth: 180,
  },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  message: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 15,
    color: Colors.secondary, textAlign: 'center',
  },
});
