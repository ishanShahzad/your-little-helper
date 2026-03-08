import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const moods = [
  { key: 'energetic', emoji: '⚡', label: 'Full of energy', desc: 'Ready to run & explore!', bg: Colors.yellowLight, border: Colors.yellow },
  { key: 'chill', emoji: '😌', label: 'Chill day', desc: 'Easy pace, steady fun', bg: Colors.greenLight, border: Colors.green },
  { key: 'rainy', emoji: '🌧️', label: 'Rainy day', desc: 'Indoor-friendly ideas', bg: Colors.backgroundAlt, border: Colors.primaryLight },
  { key: 'sick', emoji: '🤒', label: 'Under the weather', desc: 'Light, cosy activities', bg: Colors.purpleLight, border: Colors.purple },
];

export default function MoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setMood = useHuntStore((s) => s.setMood);

  function handleMood(mood: string) {
    setMood(mood);
    // Rainy/sick go to itinerary, others to home for mode selection
    if (mood === 'rainy' || mood === 'sick') {
      router.push('/(app)/itinerary-setup');
    } else {
      router.push('/(app)/mode-select');
    }
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Today's Vibe" />

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.headline}>How's the family feeling today?</Text>
        <Text style={styles.subline}>This helps us match the perfect adventure for you</Text>

        <View style={styles.grid}>
          {moods.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.card, { backgroundColor: m.bg, borderColor: m.border }]}
              onPress={() => handleMood(m.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{m.emoji}</Text>
              <Text style={styles.label}>{m.label}</Text>
              <Text style={styles.moddesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => { setMood(null as any); router.push('/(app)/mode-select'); }} style={styles.skipLink}>
          <Text style={styles.skipText}>Skip — I'll choose manually →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  headline: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 4 },
  subline: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    width: '47%', borderRadius: 20, borderWidth: 2,
    padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 130,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  label: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, textAlign: 'center' },
  moddesc: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, textAlign: 'center', marginTop: 4 },
  skipLink: { alignSelf: 'center', paddingVertical: 12 },
  skipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.secondary },
});
