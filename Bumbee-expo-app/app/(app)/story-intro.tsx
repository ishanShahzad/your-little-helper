import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeButton } from '../../components/BeeButton';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const characterEmojis: Record<string, string> = {
  pirate: '🏴‍☠️', spy: '🕵️', fairy: '🧚', unicorn: '🦄', explorer: '🧭',
};

const characterNames: Record<string, string> = {
  pirate: 'Captain Goldbeard', spy: 'Agent B', fairy: 'Sparkle', unicorn: 'Stardust', explorer: 'Scout',
};

export default function StoryIntroScreen() {
  const router = useRouter();
  const { selectedTheme, durationMinutes, currentHunt } = useHuntStore();
  const theme = selectedTheme || 'explorer';
  const emoji = characterEmojis[theme] || '🐝';
  const charName = characterNames[theme] || 'Bumbee';

  const storyIntro = currentHunt?.storyIntro || getDefaultStory(theme, charName);

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

  const stopCount = durationMinutes <= 30 ? 3 : durationMinutes <= 60 ? 4 : durationMinutes <= 90 ? 5 : 6;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.emojiContainer}>
        <Text style={styles.bigEmoji}>{emoji}</Text>
      </View>

      <Text style={styles.title}>{charName}'s Adventure</Text>

      <View style={styles.storyBox}>
        <Text style={styles.storyText}>"{storyIntro}"</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>{stopCount}</Text>
          <Text style={styles.infoLabel}>Stops</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>{durationMinutes}m</Text>
          <Text style={styles.infoLabel}>Duration</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>{emoji}</Text>
          <Text style={styles.infoLabel}>Guide</Text>
        </View>
      </View>

      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How it works</Text>
        <View style={styles.step}>
          <Text style={styles.stepNum}>1</Text>
          <Text style={styles.stepText}>Follow clues to each location on the map</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNum}>2</Text>
          <Text style={styles.stepText}>Complete the mission at each stop</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNum}>3</Text>
          <Text style={styles.stepText}>Take photos to unlock AR characters</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepNum}>4</Text>
          <Text style={styles.stepText}>Reach the finale and claim your reward!</Text>
        </View>
      </View>

      <BeeButton title="🚀 Start Hunt!" onPress={() => router.push('/(app)/live-map')} style={styles.btn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center', backgroundColor: Colors.background },
  emojiContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 16 },
  bigEmoji: { fontSize: 64 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, marginBottom: 16, textAlign: 'center' },
  storyBox: { backgroundColor: Colors.backgroundAlt, borderRadius: 16, padding: 20, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  storyText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text, fontStyle: 'italic', lineHeight: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 24, width: '100%' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoValue: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.primary },
  infoLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  infoDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  howItWorks: { width: '100%', marginBottom: 24 },
  howTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, color: Colors.white, fontFamily: 'Fredoka_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 28, marginRight: 12, overflow: 'hidden' },
  stepText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, flex: 1 },
  btn: { width: '100%', marginBottom: 40 },
});
