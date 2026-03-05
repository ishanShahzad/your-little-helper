import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

export default function AgesScreen() {
  const router = useRouter();
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
    setKids(kids.filter((_, i) => i !== index));
  }

  function handleContinue() {
    const ages = kids.filter((k) => k.age).map((k) => parseInt(k.age));
    setAges(ages);
    router.push('/(app)/duration');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Who's Coming?" />
      {/* Progress bar: Step 1 of 5 (ages is first in scavenger hunt flow) */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressDot, step <= 1 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Who's coming on the adventure?</Text>
        <Text style={styles.subtitle}>Ages help us create age-appropriate clues & challenges</Text>

        {kids.map((kid, i) => (
          <BeeCard key={i} style={styles.kidCard}>
            <View style={styles.kidRow}>
              <TextInput style={styles.nameInput} placeholder="Name" value={kid.name} onChangeText={(v) => updateKid(i, 'name', v)} placeholderTextColor={Colors.secondary} />
              <TextInput style={styles.ageInput} placeholder="Age" value={kid.age} onChangeText={(v) => updateKid(i, 'age', v)} keyboardType="numeric" maxLength={2} placeholderTextColor={Colors.secondary} />
              {kids.length > 1 && (
                <TouchableOpacity onPress={() => removeKid(i)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </BeeCard>
        ))}

        {kids.length < 6 && (
          <TouchableOpacity onPress={addKid} style={styles.addBtn}>
            <Text style={styles.addText}>+ Add another child</Text>
          </TouchableOpacity>
        )}

        <BeeButton title="Continue" onPress={handleContinue} style={styles.continueBtn} />
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
  kidCard: { marginBottom: 12 },
  kidRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: { flex: 1, height: 40, borderBottomWidth: 1, borderColor: Colors.border, fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text },
  ageInput: { width: 60, height: 40, borderBottomWidth: 1, borderColor: Colors.border, fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text, textAlign: 'center' },
  remove: { fontSize: 18, color: Colors.error, padding: 4 },
  addBtn: { alignItems: 'center', paddingVertical: 16 },
  addText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.primary },
  continueBtn: { marginTop: 20 },
});
