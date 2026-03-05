import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const treasureTypes = [
  { key: 'edible', label: 'Edible treat', emoji: '🍭' },
  { key: 'toy', label: 'Small toy', emoji: '🧸' },
  { key: 'sticker', label: 'Sticker pack', emoji: '⭐' },
  { key: 'mystery', label: 'Mystery prize', emoji: '🎁' },
];

export default function HuntPrefsScreen() {
  const router = useRouter();
  const { huntPrefs, setHuntPrefs } = useHuntStore();
  const [selected, setSelected] = useState(huntPrefs.treasureType);
  const [eatDuring, setEatDuring] = useState(huntPrefs.eatDuring);

  function handleContinue() {
    setHuntPrefs({ treasureType: selected, eatDuring });
    router.push('/(app)/theme-select');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Hunt Preferences" />
      {/* Progress bar: Step 3 of 5 */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressDot, step <= 3 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set up your hunt</Text>
        <Text style={styles.subtitle}>What should the treasure be at the finale?</Text>

        <Text style={styles.sectionTitle}>🏆 Treasure type</Text>
        {treasureTypes.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setSelected(t.label)} activeOpacity={0.7}>
            <View style={[styles.optionCard, selected === t.label && styles.selectedCard]}>
              <Text style={styles.optionEmoji}>{t.emoji}</Text>
              <Text style={styles.optionText}>{t.label}</Text>
              {selected === t.label && <Text style={styles.check}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>🍽️ Food break</Text>
        <Text style={styles.sectionDesc}>Should we include a food stop during the hunt?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setEatDuring(false)} style={[styles.toggleBtn, !eatDuring && styles.toggleActive]}>
            <Text style={[styles.toggleText, !eatDuring && styles.toggleTextActive]}>Eat after</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEatDuring(true)} style={[styles.toggleBtn, eatDuring && styles.toggleActive]}>
            <Text style={[styles.toggleText, eatDuring && styles.toggleTextActive]}>Eat during</Text>
          </TouchableOpacity>
        </View>

        <BeeButton title="Choose Theme →" onPress={handleContinue} style={styles.btn} />
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
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 4 },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 12, marginTop: 8 },
  sectionDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  selectedCard: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  optionEmoji: { fontSize: 24, marginRight: 12 },
  optionText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text, flex: 1 },
  check: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.primary },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  toggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  toggleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  toggleTextActive: { color: Colors.white },
  btn: { marginTop: 8 },
});
