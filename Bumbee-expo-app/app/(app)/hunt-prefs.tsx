import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const treasureTypes = [
  { key: 'edible', label: 'Edible treat', emoji: '🍭', hint: 'Ice cream, sweets, etc.' },
  { key: 'toy', label: 'Small toy', emoji: '🧸', hint: 'From a nearby toy shop' },
  { key: 'sticker', label: 'Sticker pack', emoji: '⭐', hint: 'A fun prize to collect' },
  { key: 'mystery', label: 'Mystery prize', emoji: '🎁', hint: 'Surprise the little ones!' },
];

export default function HuntPrefsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { huntPrefs, setHuntPrefs } = useHuntStore();
  const [selected, setSelected] = useState(huntPrefs.treasureType || 'edible');
  const [eatDuring, setEatDuring] = useState(huntPrefs.eatDuring ?? false);
  const [budget, setBudget] = useState(huntPrefs.budget || 50);
  const [transportMode, setTransportMode] = useState(huntPrefs.transportMode || 'walking');
  const [environment, setEnvironment] = useState(huntPrefs.environment || 'mixed');

  function handleContinue() {
    setHuntPrefs({ 
      treasureType: selected, 
      eatDuring,
      budget,
      transportMode,
      environment
    });
    router.push('/(app)/theme-select');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Hunt Details" />

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressSeg, step <= 3 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Set up your hunt 🎯</Text>

        {/* ── Treasure type ── */}
        <Text style={styles.sectionLabel}>FINALE TREASURE TYPE</Text>
        <View style={styles.grid}>
          {treasureTypes.map((t) => {
            const isSelected = selected === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setSelected(t.key)}
                activeOpacity={0.8}
                style={[styles.treasureCard, isSelected && styles.treasureCardSelected]}
              >
                <Text style={styles.treasureEmoji}>{t.emoji}</Text>
                <Text style={[styles.treasureLabel, isSelected && { color: Colors.primary }]}>{t.label}</Text>
                <Text style={styles.treasureHint}>{t.hint}</Text>
                {isSelected && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Food break ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>FOOD BREAK 🍽</Text>
        <Text style={styles.sectionDesc}>We'll route you to a nearby restaurant or café — choose when!</Text>
        <View style={styles.toggleRow}>
          {[
            { value: false, label: '🍽 Eat after', desc: 'Last stop is a food spot — celebrate when you finish!' },
            { value: true, label: '🥪 Eat during', desc: 'Food stop halfway through — refuel and keep going!' },
          ].map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              onPress={() => setEatDuring(opt.value)}
              activeOpacity={0.8}
              style={[styles.toggleCard, eatDuring === opt.value && styles.toggleCardActive]}
            >
              <Text style={styles.toggleEmoji}>{opt.label}</Text>
              <Text style={[styles.toggleDesc, eatDuring === opt.value && { color: Colors.primary }]}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Budget ── */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>BUDGET</Text>
        <Text style={styles.sectionDesc}>How much are you willing to spend on treats and activities?</Text>
        <View style={styles.budgetRow}>
          {[10, 20, 30, 50, 100].map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => setBudget(amount)}
              activeOpacity={0.8}
              style={[styles.budgetChip, budget === amount && styles.budgetChipActive]}
            >
              <Text style={[styles.budgetText, budget === amount && { color: Colors.primary }]}>
                ${amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Transport Mode ── */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>TRANSPORT MODE</Text>
        <Text style={styles.sectionDesc}>How will you get around?</Text>
        <View style={styles.toggleRow}>
          {[
            { value: 'walking', label: '🚶 Walking', desc: 'Nearby locations (800m-2km)' },
            { value: 'car', label: '🚗 Driving', desc: 'Wider area (3km-7km)' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setTransportMode(opt.value)}
              activeOpacity={0.8}
              style={[styles.toggleCard, transportMode === opt.value && styles.toggleCardActive]}
            >
              <Text style={styles.toggleEmoji}>{opt.label}</Text>
              <Text style={[styles.toggleDesc, transportMode === opt.value && { color: Colors.primary }]}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Environment ── */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ENVIRONMENT PREFERENCE</Text>
        <Text style={styles.sectionDesc}>What type of locations do you prefer?</Text>
        <View style={styles.environmentRow}>
          {[
            { value: 'outdoor', label: '🌳 Outdoor', desc: 'Parks, zoos & playgrounds' },
            { value: 'indoor', label: '🏠 Indoor', desc: 'Museums, cinemas & bowling' },
            { value: 'mixed', label: '🔀 Mixed', desc: 'Best of both worlds!' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setEnvironment(opt.value)}
              activeOpacity={0.8}
              style={[styles.envCard, environment === opt.value && styles.envCardActive]}
            >
              <Text style={styles.envEmoji}>{opt.label}</Text>
              <Text style={[styles.envDesc, environment === opt.value && { color: Colors.primary }]}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <BeeButton title="Pick a Theme →" onPress={handleContinue} />
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
  headline: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 20 },
  sectionLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 12, color: Colors.secondary, letterSpacing: 1.2, marginBottom: 12 },
  sectionDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 12, marginTop: -6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  treasureCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  treasureCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  treasureEmoji: { fontSize: 32, marginBottom: 8 },
  treasureLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  treasureHint: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, textAlign: 'center', marginTop: 4 },
  selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 8 },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  toggleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  toggleEmoji: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.text, marginBottom: 4 },
  toggleDesc: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, textAlign: 'center' },
  budgetRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  budgetChip: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  budgetChipActive: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  budgetText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  environmentRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  envCard: {
    flex: 1, borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  envCardActive: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  envEmoji: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 4 },
  envDesc: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: Colors.secondary, textAlign: 'center' },
});
