import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const finaleTypes = [
  { emoji: '🏴‍☠️', text: 'Treasure Chest Revealed!' },
  { emoji: '📜', text: 'Scroll of Achievement!' },
  { emoji: '🏆', text: 'Golden Trophy!' },
  { emoji: '🌀', text: 'Magical Portal!' },
  { emoji: '🏕️', text: 'Secret Hideout Discovered!' },
];

export default function FinaleScreen() {
  const router = useRouter();
  const { currentHunt, resetHunt } = useHuntStore();
  const setModal = useAppStore((s) => s.setModal);
  const [recapLoading, setRecapLoading] = useState(false);
  const finale = finaleTypes[Math.floor(Math.random() * finaleTypes.length)];

  const stopsCompleted = currentHunt?.stops.filter((s) => s.completed).length || 0;
  const distKm = ((currentHunt?.route?.distance || 0) / 1000).toFixed(1);
  const giggles = Math.floor(Math.random() * 15) + 10;

  async function handleCreateRecap() {
    if (!currentHunt) return;
    setRecapLoading(true);
    try {
      const { data } = await api.post(`/hunts/${currentHunt._id}/recap`);
      if (data.data?.recapCardUrl) {
        await Share.share({
          message: `🐝 Check out our Bumbee adventure! ${data.data.recapCardUrl}`,
        });
      } else {
        Alert.alert('Recap Created!', 'Your adventure recap is ready to share.');
      }
    } catch {
      Alert.alert('Error', 'Could not create recap card');
    } finally {
      setRecapLoading(false);
    }
  }

  async function handleSendToGrandparents() {
    const message = `🐝 Hi from Bumbee!\n\nWe just completed a ${currentHunt?.theme || 'fun'} scavenger hunt!\n📍 ${stopsCompleted} stops visited\n🚶 ${distKm} km walked\n😄 ~${giggles} giggles estimated\n\nLove from the family! ❤️`;
    try {
      await Share.share({ message });
    } catch {}
  }

  function handleChallengeAFriend() {
    setModal('referralModalOpen', true);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.celebration}>{finale.emoji}</Text>
      <Text style={styles.title}>{finale.text}</Text>
      <Text style={styles.subtitle}>Adventure Complete!</Text>

      <BeeCard style={styles.summaryCard}>
        <Text style={styles.stat}>📍 {stopsCompleted} stops completed</Text>
        <Text style={styles.stat}>🚶 {distKm} km walked</Text>
        <Text style={styles.stat}>😄 ~{giggles} giggles estimated</Text>
        <Text style={styles.stat}>⏱️ Great adventure time!</Text>
      </BeeCard>

      <BeeButton title="📸 Create Shareable Recap" onPress={handleCreateRecap} loading={recapLoading} style={styles.btn} />
      <BeeButton title="💌 Send to Grandparents" onPress={handleSendToGrandparents} variant="secondary" style={styles.btn} />
      <BeeButton title="⭐ Rate This Hunt" onPress={() => router.push('/(app)/rating')} style={styles.btn} />

      <View style={styles.secondaryActions}>
        <Text style={styles.challengeLink} onPress={handleChallengeAFriend}>🎁 Challenge a Friend</Text>
      </View>

      <BeeButton
        title="🏠 Back to Home"
        onPress={() => { resetHunt(); router.replace('/(app)/mode-select'); }}
        variant="secondary"
        style={styles.btn}
      />
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
  secondaryActions: { alignItems: 'center', marginBottom: 16 },
  challengeLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
});
