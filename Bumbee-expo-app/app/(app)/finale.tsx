import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeButton } from '../../components/BeeButton';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function FinaleScreen() {
  const router = useRouter();
  const { currentHunt, resetHunt } = useHuntStore();
  const setModal = useAppStore((s) => s.setModal);
  const [recapLoading, setRecapLoading] = useState(false);

  const stopsCompleted = currentHunt?.stops.filter((s) => s.completed).length || currentHunt?.stops.length || 0;
  const distKm = ((currentHunt?.route?.distance || 0) / 1000).toFixed(1);
  const totalCost = currentHunt?.totalEstimatedCost || 0;
  const giggles = Math.floor(Math.random() * 15) + 10;
  const charEmoji = currentHunt?.storyCharacterEmoji || '🐝';
  const charName = currentHunt?.storyCharacter || 'Bumbee';
  const theme = currentHunt?.theme || 'explorer';

  async function handleCreateRecap() {
    if (!currentHunt) return;
    setRecapLoading(true);
    try {
      const { data } = await api.post(`/hunts/${currentHunt._id}/recap`);
      if (data.data?.recapCardUrl) {
        await Share.share({ message: `🐝 Check out our Bumbee adventure! ${data.data.recapCardUrl}` });
      } else {
        Alert.alert('Recap Created!', 'Your adventure recap is ready!');
      }
    } catch {
      Alert.alert('Error', 'Could not create recap card');
    } finally {
      setRecapLoading(false);
    }
  }

  async function handleSendToGrandparents() {
    const message = `🐝 Hi from Bumbee!\n\nWe just completed a ${theme} scavenger hunt with ${charName}!\n📍 ${stopsCompleted} stops visited\n🚶 ${distKm} km walked\n💰 $${totalCost.toFixed(0)} spent\n😄 ~${giggles} giggles estimated\n\nLove from the family! ❤️`;
    try { await Share.share({ message }); } catch { }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Celebration header */}
      <View style={styles.celebrationBg}>
        <Text style={styles.bigEmoji}>{charEmoji}</Text>
        <Text style={styles.title}>🏆 Treasure Found!</Text>
        <Text style={styles.subtitle}>{charName}'s Adventure Complete!</Text>
      </View>

      {/* Stats card */}
      <BeeCard style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stopsCompleted}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distKm}km</Text>
            <Text style={styles.statLabel}>Walked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalCost.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>~{giggles}</Text>
            <Text style={styles.statLabel}>Giggles</Text>
          </View>
        </View>
      </BeeCard>

      {/* Finale destination reward card */}
      {currentHunt?.finale && (
        <BeeCard style={styles.finaleCard}>
          <Text style={styles.finaleCardTitle}>Your Reward Awaits 🏆</Text>
          <Text style={styles.finaleVenueName}>{currentHunt.finale.placeName}</Text>
          {!!currentHunt.finale.address && (
            <Text style={styles.finaleAddress}>📍 {currentHunt.finale.address}</Text>
          )}
          <Text style={styles.finaleTask}>{currentHunt.finale.task}</Text>
          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={() => {
              Linking.openURL(currentHunt.finale!.googleMapsLink).catch(() =>
                Alert.alert('Error', 'Could not open Google Maps'),
              );
            }}
          >
            <Text style={styles.navigateBtnText}>🗺️ Navigate There</Text>
          </TouchableOpacity>
        </BeeCard>
      )}

      {/* Photo collage placeholder */}
      {currentHunt?.stops.some(s => s.photoUrl) && (
        <BeeCard style={styles.photosCard}>
          <Text style={styles.photosTitle}>📸 Your Adventure Photos</Text>
          <View style={styles.photoGrid}>
            {currentHunt.stops.filter(s => s.photoUrl).slice(0, 4).map((s, i) => (
              <View key={i} style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>🖼️</Text>
                <Text style={styles.photoStopName}>{s.name}</Text>
              </View>
            ))}
          </View>
        </BeeCard>
      )}

      {/* Character message */}
      <View style={styles.characterMsg}>
        <Text style={styles.charEmoji}>{charEmoji}</Text>
        <View style={styles.charBubble}>
          <Text style={styles.charText}>"What an amazing adventure! You solved every clue and found the treasure! Until next time, adventurer!"</Text>
          <Text style={styles.charName}>— {charName}</Text>
        </View>
      </View>

      {/* Actions */}
      <BeeButton title="📸 Create & Share Recap" onPress={handleCreateRecap} loading={recapLoading} style={styles.btn} />
      <BeeButton title="💌 Send to Grandparents" onPress={handleSendToGrandparents} variant="secondary" style={styles.btn} />
      <BeeButton title="⭐ Rate This Hunt" onPress={() => router.push('/(app)/rating')} variant="secondary" style={styles.btn} />

      <View style={styles.secondaryActions}>
        <Text style={styles.challengeLink} onPress={() => setModal('referralModalOpen', true)}>🎁 Challenge a Friend</Text>
      </View>

      <BeeButton
        title="🏠 Back to Home"
        onPress={() => { resetHunt(); router.replace('/(app)/mode-select'); }}
        variant="secondary"
        style={styles.homeBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: Colors.background },
  celebrationBg: { alignItems: 'center', backgroundColor: Colors.backgroundAlt, borderRadius: 20, padding: 32, marginBottom: 20 },
  bigEmoji: { fontSize: 72, marginBottom: 8 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.primary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text },
  statsCard: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.primary },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  photosCard: { marginBottom: 16 },
  photosTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoPlaceholder: { width: '48%', aspectRatio: 1, backgroundColor: Colors.backgroundAlt, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  photoEmoji: { fontSize: 32 },
  photoStopName: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: Colors.secondary, marginTop: 4 },
  characterMsg: { flexDirection: 'row', marginBottom: 20 },
  charEmoji: { fontSize: 40, marginRight: 12 },
  charBubble: { flex: 1, backgroundColor: Colors.backgroundAlt, borderRadius: 16, padding: 14, borderTopLeftRadius: 4 },
  charText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 20 },
  charName: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary, marginTop: 4 },
  btn: { width: '100%', marginBottom: 10 },
  secondaryActions: { alignItems: 'center', marginBottom: 12 },
  challengeLink: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  homeBtn: { width: '100%', marginBottom: 40 },
  finaleCard: { marginBottom: 16, borderWidth: 2, borderColor: '#F5C518' },
  finaleCardTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: '#F5C518', marginBottom: 6 },
  finaleVenueName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 4 },
  finaleAddress: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, fontStyle: 'italic', marginBottom: 8 },
  finaleTask: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 14 },
  navigateBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  navigateBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },
});
