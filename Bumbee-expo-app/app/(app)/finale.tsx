import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const finaleTypes = ['🏴‍☠️ Treasure Chest Revealed!', '📜 Scroll of Achievement!', '🏆 Golden Trophy!', '🌀 Magical Portal!', '🏕️ Secret Hideout Discovered!'];

export default function FinaleScreen() {
  const router = useRouter();
  const { currentHunt, resetHunt } = useHuntStore();
  const finaleText = finaleTypes[Math.floor(Math.random() * finaleTypes.length)];

  const stopsCompleted = currentHunt?.stops.filter((s) => s.completed).length || 0;
  const distKm = ((currentHunt?.route?.distance || 0) / 1000).toFixed(1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.celebration}>🎉</Text>
      <Text style={styles.title}>{finaleText}</Text>
      <Text style={styles.subtitle}>Adventure Complete!</Text>

      <BeeCard style={styles.summaryCard}>
        <Text style={styles.stat}>📍 {stopsCompleted} stops completed</Text>
        <Text style={styles.stat}>🚶 {distKm} km walked</Text>
        <Text style={styles.stat}>⏱️ Great adventure time!</Text>
      </BeeCard>

      <BeeButton title="⭐ Rate This Hunt" onPress={() => router.push('/(app)/rating')} style={styles.btn} />
      <BeeButton title="🏠 Back to Home" onPress={() => { resetHunt(); router.replace('/(app)/mode-select'); }} variant="secondary" style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  celebration: { fontSize: 80, marginBottom: 16 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 24 },
  summaryCard: { width: '100%', marginBottom: 24 },
  stat: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text, marginBottom: 8 },
  btn: { width: '100%', marginBottom: 12 },
});
