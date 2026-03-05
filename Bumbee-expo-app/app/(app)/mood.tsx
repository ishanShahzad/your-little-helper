import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const moods = [
  { key: 'energetic', emoji: '⚡', label: 'Full of energy' },
  { key: 'chill', emoji: '😌', label: 'Chill day' },
  { key: 'rainy', emoji: '🌧️', label: 'Rainy day' },
  { key: 'sick', emoji: '🤒', label: 'Under the weather' },
];

export default function MoodScreen() {
  const router = useRouter();
  const setMood = useHuntStore((s) => s.setMood);

  function handleMood(mood: string) {
    setMood(mood);
    if (mood === 'rainy' || mood === 'sick') {
      router.push('/(app)/mode-select');
    } else {
      router.push('/(app)/mode-select');
    }
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Mood" />
      {/* Progress bar: Step 1 of 5 */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressDot, step <= 1 && styles.progressActive]} />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>How's the family feeling?</Text>
        <Text style={styles.subtitle}>This helps us pick the perfect adventure</Text>

        <View style={styles.grid}>
          {moods.map((m) => (
            <TouchableOpacity key={m.key} style={styles.card} onPress={() => handleMood(m.key)} activeOpacity={0.7}>
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={styles.label}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => { setMood(null); router.push('/(app)/mode-select'); }} style={styles.skipLink}>
          <Text style={styles.skipText}>Skip — choose manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary },
  content: { flex: 1, padding: 24 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  card: {
    width: '47%', aspectRatio: 1, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, textAlign: 'center' },
  skipLink: { marginTop: 32, alignItems: 'center' },
  skipText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textDecorationLine: 'underline' },
});
