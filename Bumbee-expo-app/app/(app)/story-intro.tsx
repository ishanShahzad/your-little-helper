import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const characterEmojis: Record<string, string> = {
  pirate: '🏴‍☠️', spy: '🕵️', fairy: '🧚', unicorn: '🦄', explorer: '🧭',
};
const characterNames: Record<string, string> = {
  pirate: 'Captain Goldbeard', spy: 'Agent B', fairy: 'Sparkle', unicorn: 'Stardust', explorer: 'Scout',
};
const themeAccents: Record<string, string> = {
  pirate: '#D4A017', spy: Colors.primary, fairy: '#C026D3', unicorn: Colors.purple, explorer: Colors.green,
};
const themeBgs: Record<string, string> = {
  pirate: '#FFF7E6', spy: '#F0F7FF', fairy: '#FDF2F8', unicorn: '#F5F3FF', explorer: '#F0FDF4',
};

export default function StoryIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTheme, durationMinutes, currentHunt } = useHuntStore();
  const theme = selectedTheme || 'explorer';
  const emoji = characterEmojis[theme] || '🐝';
  const charName = characterNames[theme] || 'Bumbee';
  const accent = themeAccents[theme] || Colors.primary;
  const themeBg = themeBgs[theme] || Colors.backgroundAlt;

  const storyIntro = currentHunt?.storyIntro || getDefaultStory(theme, charName);
  const stopCount = durationMinutes <= 30 ? 3 : durationMinutes <= 60 ? 4 : durationMinutes <= 90 ? 5 : 6;

  function getDefaultStory(t: string, name: string): string {
    const stories: Record<string, string> = {
      pirate: `${name} lost his treasure across the city! Secret locations hold clues. Solve them all and the treasure will be yours!`,
      spy: `${name} has intercepted a coded message. Secret drops are hidden across the city. Your mission: decode them all!`,
      fairy: `${name}'s magical wand scattered fairy dust across the neighbourhood! Follow the sparkle trail to collect them all!`,
      unicorn: `${name} galloped through a rainbow portal and left magical hoofprints everywhere! Follow the trail to find them all!`,
      explorer: `${name} discovered an ancient map with mysterious markings! Each location holds a piece of the puzzle!`,
    };
    return stories[t] || `${name} needs your help on an incredible adventure!`;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Character hero ── */}
      <View style={[styles.heroBg, { backgroundColor: themeBg }]}>
        <View style={[styles.emojiRing, { borderColor: accent + '44', backgroundColor: accent + '14' }]}>
          <Text style={styles.bigEmoji}>{emoji}</Text>
        </View>
        <Text style={[styles.charName, { color: accent }]}>{charName}'s Adventure</Text>
        <Text style={styles.themeTag}>{(theme.charAt(0).toUpperCase() + theme.slice(1))} Theme • {stopCount} stops • {durationMinutes} min</Text>
      </View>

      {/* ── Story ── */}
      <View style={[styles.storyCard, { borderLeftColor: accent }]}>
        <Text style={styles.storyQuote}>"</Text>
        <Text style={styles.storyText}>{storyIntro}</Text>
        <Text style={[styles.storyQuoteEnd, { color: accent }]}>"</Text>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        {[
          { value: stopCount.toString(), label: 'Stops', emoji: '📍' },
          { value: `${durationMinutes}m`, label: 'Duration', emoji: '⏱' },
          { value: currentHunt?.totalEstimatedCost ? `$${currentHunt.totalEstimatedCost}` : '$0', label: 'Est. Cost', emoji: '💰' },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={[styles.statValue, { color: accent }]}>{s.emoji ? `${s.emoji} ${s.value}` : s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── How it works ── */}
      <View style={styles.howCard}>
        <Text style={styles.howTitle}>How it works</Text>
        {[
          'Follow clues to each location on the map',
          'Complete the mission challenge at each stop',
          'Take photos to unlock AR characters',
          'Reach the finale and claim your treasure! 🏆',
        ].map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: accent }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <BeeButton title={`🚀 Start ${charName}'s Hunt!`} onPress={() => router.push('/(app)/live-map')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: Colors.background },
  heroBg: {
    borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  emojiRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  bigEmoji: { fontSize: 58 },
  charName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, textAlign: 'center' },
  themeTag: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 6, textAlign: 'center' },
  storyCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 20,
    borderLeftWidth: 4, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  storyQuote: { fontFamily: 'Fredoka_600SemiBold', fontSize: 40, color: Colors.borderLight, lineHeight: 36, marginBottom: -10 },
  storyText: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textBody, fontStyle: 'italic', lineHeight: 24, marginHorizontal: 8 },
  storyQuoteEnd: { fontFamily: 'Fredoka_600SemiBold', fontSize: 40, textAlign: 'right', lineHeight: 48, marginTop: -12 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 18,
    padding: 16, marginBottom: 20, justifyContent: 'space-around',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 17 },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, marginTop: 2 },
  howCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  howTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 17, color: Colors.text, marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumText: { color: '#fff', fontFamily: 'Fredoka_600SemiBold', fontSize: 13 },
  stepText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textBody, flex: 1, lineHeight: 20 },
});
