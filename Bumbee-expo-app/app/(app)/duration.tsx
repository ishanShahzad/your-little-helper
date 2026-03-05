import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const durations = [
  { key: 30, emoji: '⚡', label: '30 min', desc: 'Quick dash — 3 stops' },
  { key: 60, emoji: '🚶', label: '1 hour', desc: 'Classic adventure — 4 stops' },
  { key: 90, emoji: '🏃', label: '1.5 hours', desc: 'Extended fun — 5 stops' },
  { key: 120, emoji: '🗺️', label: '2 hours', desc: 'Epic expedition — 6 stops' },
];

export default function DurationScreen() {
  const router = useRouter();
  const { durationMinutes, setDuration } = useHuntStore();
  const [selected, setSelected] = useState(durationMinutes);

  function handleContinue() {
    setDuration(selected);
    router.push('/(app)/hunt-prefs');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Duration" />
      {/* Progress bar: Step 2 of 5 */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressDot, step <= 2 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>How long do you have?</Text>
        <Text style={styles.subtitle}>We'll find the perfect number of stops</Text>

        {durations.map((d) => (
          <TouchableOpacity key={d.key} onPress={() => setSelected(d.key)} activeOpacity={0.7}>
            <View style={[styles.card, selected === d.key && styles.cardSelected]}>
              <Text style={styles.cardEmoji}>{d.emoji}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{d.label}</Text>
                <Text style={styles.cardDesc}>{d.desc}</Text>
              </View>
              {selected === d.key && <Text style={styles.check}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        <BeeButton title="Continue" onPress={handleContinue} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  content: { padding: 24 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 24, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, padding: 16, marginBottom: 12 },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  cardEmoji: { fontSize: 32, marginRight: 16 },
  cardInfo: { flex: 1 },
  cardLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text },
  cardDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  check: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.primary },
  btn: { marginTop: 16 },
});
