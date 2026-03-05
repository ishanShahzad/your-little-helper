import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const treasureTypes = ['Edible treat', 'Small toy', 'Sticker pack', 'Mystery prize'];

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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set up your hunt</Text>

        <Text style={styles.sectionTitle}>Treasure type</Text>
        {treasureTypes.map((t) => (
          <TouchableOpacity key={t} onPress={() => setSelected(t)} activeOpacity={0.7}>
            <BeeCard style={[styles.optionCard, selected === t && styles.selectedCard]}>
              <Text style={styles.optionText}>{t}</Text>
            </BeeCard>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Food break</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setEatDuring(false)} style={[styles.toggleBtn, !eatDuring && styles.toggleActive]}>
            <Text style={[styles.toggleText, !eatDuring && styles.toggleTextActive]}>Eat after hunt</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEatDuring(true)} style={[styles.toggleBtn, eatDuring && styles.toggleActive]}>
            <Text style={[styles.toggleText, eatDuring && styles.toggleTextActive]}>Eat during hunt</Text>
          </TouchableOpacity>
        </View>

        <BeeButton title="Choose Theme" onPress={handleContinue} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 12, marginTop: 8 },
  optionCard: { marginBottom: 8, padding: 14 },
  selectedCard: { borderColor: Colors.primary, backgroundColor: '#FFF5E0' },
  optionText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  toggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  toggleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  toggleTextActive: { color: Colors.white },
  btn: { marginTop: 8 },
});
