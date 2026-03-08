import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const durations = [
  { key: 30, emoji: '⚡', label: '30 min', desc: 'Quick dash', stops: '3 stops', color: Colors.greenLight, textColor: Colors.green },
  { key: 60, emoji: '🚶', label: '1 hour', desc: 'Classic', stops: '4 stops', color: Colors.backgroundAlt, textColor: Colors.primary },
  { key: 90, emoji: '🏃', label: '1.5 hours', desc: 'Extended fun', stops: '5 stops', color: Colors.yellowLight, textColor: Colors.accentDeep },
  { key: 120, emoji: '🗺️', label: '2 hours', desc: 'Epic expedition', stops: '6 stops', color: Colors.purpleLight, textColor: Colors.purple },
];

export default function DurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { durationMinutes, setDuration } = useHuntStore();
  const [selected, setSelected] = useState(durationMinutes || 60);

  function handleContinue() {
    setDuration(selected);
    router.push('/(app)/hunt-prefs');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="How Long?" />

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressSeg, step <= 2 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>How long do you have?</Text>
        <Text style={styles.subline}>We'll pick the perfect number of stops for your time</Text>

        <View style={styles.grid}>
          {durations.map((d) => {
            const isSelected = selected === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                onPress={() => setSelected(d.key)}
                activeOpacity={0.8}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={[styles.emojiCircle, { backgroundColor: d.color }]}>
                  <Text style={styles.cardEmoji}>{d.emoji}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>{d.label}</Text>
                  <Text style={styles.cardDesc}>{d.desc}</Text>
                </View>
                <View style={[styles.stopsBadge, { backgroundColor: isSelected ? Colors.primary : d.color }]}>
                  <Text style={[styles.stopsText, { color: isSelected ? '#fff' : d.textColor }]}>{d.stops}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <BeeButton title="Continue →" onPress={handleContinue} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressStrip: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, paddingVertical: 10 },
  progressSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: Colors.borderLight },
  progressActive: { backgroundColor: Colors.primary },
  content: { padding: 20 },
  headline: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 4 },
  subline: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 24, lineHeight: 20 },
  grid: { gap: 12, marginBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18,
    padding: 16, borderWidth: 2, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundAlt,
    shadowColor: Colors.primary, shadowOpacity: 0.15,
  },
  emojiCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 26 },
  cardContent: { flex: 1 },
  cardLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text },
  cardDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 2 },
  stopsBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  stopsText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  btn: {},
});
