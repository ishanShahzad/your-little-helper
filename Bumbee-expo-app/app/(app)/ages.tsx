import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const KID_EMOJIS = ['🐣', '🐥', '🐤', '🐦', '🦁', '🐯'];

const PRESET_AGES = [3, 4, 5, 6, 7, 8, 9, 10];

export default function AgesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAges = useHuntStore((s) => s.setAges);
  const [kids, setKids] = useState<{ name: string; age: string }[]>([{ name: '', age: '' }]);

  function addKid() {
    if (kids.length >= 6) return;
    setKids([...kids, { name: '', age: '' }]);
  }

  function updateKid(index: number, field: 'name' | 'age', value: string) {
    const updated = [...kids];
    updated[index] = { ...updated[index], [field]: value };
    setKids(updated);
  }

  function removeKid(index: number) {
    if (kids.length === 1) return; // always keep at least one
    setKids(kids.filter((_, i) => i !== index));
  }

  function setPresetAge(kidIndex: number, age: number) {
    const updated = [...kids];
    updated[kidIndex] = { ...updated[kidIndex], age: age.toString() };
    setKids(updated);
  }

  function handleContinue() {
    const ages = kids.filter((k) => k.age).map((k) => parseInt(k.age));
    if (ages.length === 0) {
      // Default to age 7 if none entered
      setAges([7]);
    } else {
      setAges(ages);
    }
    router.push('/(app)/duration');
  }

  const canContinue = kids.some((k) => k.age && parseInt(k.age) > 0 && parseInt(k.age) < 18);

  return (
    <View style={styles.container}>
      <BeeHeader title="Who's Coming?" />

      {/* ── Progress strip ── */}
      <View style={styles.progressStrip}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressSeg, step === 1 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headline}>Who's joining the adventure? 🎒</Text>
        <Text style={styles.subline}>We'll tailor clues and tasks to their ages</Text>

        {kids.map((kid, i) => {
          const selectedAge = kid.age ? parseInt(kid.age) : null;
          const emoji = KID_EMOJIS[i] || '🐤';
          return (
            <View key={i} style={styles.kidCard}>
              {/* ── Header row ── */}
              <View style={styles.kidHeader}>
                <View style={styles.kidAvatarCircle}>
                  <Text style={styles.kidAvatarEmoji}>{emoji}</Text>
                </View>
                <TextInput
                  style={styles.kidNameInput}
                  placeholder={`Child ${i + 1}'s name`}
                  value={kid.name}
                  onChangeText={(v) => updateKid(i, 'name', v)}
                  placeholderTextColor={Colors.secondary}
                />
                {kids.length > 1 && (
                  <TouchableOpacity onPress={() => removeKid(i)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Age picker ── */}
              <View style={styles.ageSection}>
                <Text style={styles.ageLabel}>Age</Text>

                {/* Quick-tap preset grid */}
                <View style={styles.ageGrid}>
                  {PRESET_AGES.map((age) => (
                    <TouchableOpacity
                      key={age}
                      style={[styles.agePill, selectedAge === age && styles.agePillActive]}
                      onPress={() => setPresetAge(i, age)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.agePillText, selectedAge === age && styles.agePillTextActive]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom age input for other values */}
                <View style={styles.ageCustomRow}>
                  <Text style={styles.ageCustomLabel}>Or type age:</Text>
                  <TextInput
                    style={styles.ageInput}
                    placeholder="e.g. 11"
                    value={kid.age && !PRESET_AGES.includes(parseInt(kid.age)) ? kid.age : ''}
                    onChangeText={(v) => updateKid(i, 'age', v)}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholderTextColor={Colors.secondary}
                  />
                </View>
              </View>

              {/* ── Age badge ── */}
              {selectedAge && (
                <View style={styles.ageBadgeRow}>
                  <Text style={styles.ageBadge}>
                    {selectedAge <= 4
                      ? `🐣 Toddler (${selectedAge} yrs) — very simple tasks`
                      : selectedAge <= 7
                        ? `🌟 Little explorer (${selectedAge} yrs) — fun riddles`
                        : selectedAge <= 10
                          ? `🚀 Big adventurer (${selectedAge} yrs) — challenging clues`
                          : `🧠 Tween (${selectedAge} yrs) — complex missions`}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* ── Add child button ── */}
        {kids.length < 6 && (
          <TouchableOpacity onPress={addKid} style={styles.addKidBtn} activeOpacity={0.8}>
            <View style={styles.addKidIconCircle}>
              <Text style={styles.addKidPlus}>+</Text>
            </View>
            <View>
              <Text style={styles.addKidTitle}>Add another child</Text>
              <Text style={styles.addKidHint}>We personalise tasks for each age group</Text>
            </View>
          </TouchableOpacity>
        )}

        <BeeButton
          title="Continue →"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
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
  subline: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 24 },

  kidCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: Colors.primaryDeep, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  kidHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  kidAvatarCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  kidAvatarEmoji: { fontSize: 22 },
  kidNameInput: {
    flex: 1, height: 44, backgroundColor: Colors.background,
    borderRadius: 12, paddingHorizontal: 14,
    fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  removeBtn: { padding: 8 },
  removeText: { fontSize: 18, color: Colors.error },

  ageSection: { marginBottom: 8 },
  ageLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.secondary, marginBottom: 10 },
  ageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  agePill: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.background, borderWidth: 1.5,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  agePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agePillText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 15, color: Colors.textBody },
  agePillTextActive: { color: '#fff' },

  ageCustomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ageCustomLabel: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  ageInput: {
    width: 70, height: 40, borderRadius: 10,
    backgroundColor: Colors.background, borderWidth: 1.5,
    borderColor: Colors.border, textAlign: 'center',
    fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.primary,
  },

  ageBadgeRow: { marginTop: 8 },
  ageBadge: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary,
    backgroundColor: Colors.backgroundAlt, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
    overflow: 'hidden',
  },

  addKidBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 24,
    borderWidth: 2, borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addKidIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.backgroundAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  addKidPlus: { fontSize: 24, color: Colors.primary, fontWeight: '700' },
  addKidTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  addKidHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },

  continueBtn: {},
});
