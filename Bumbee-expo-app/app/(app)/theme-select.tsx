import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const themes = [
  { key: 'pirate', emoji: '🏴‍☠️', name: 'Pirate', character: 'Captain Goldbeard', desc: 'Find treasure, walk the plank, say Arrr!' },
  { key: 'spy', emoji: '🕵️', name: 'Spy', character: 'Agent B', desc: 'Sneak, decode, and complete secret missions' },
  { key: 'fairy', emoji: '🧚', name: 'Fairy', character: 'Sparkle', desc: 'Find fairy dust, make wishes, and dance!' },
  { key: 'unicorn', emoji: '🦄', name: 'Unicorn', character: 'Stardust', desc: 'Chase rainbows and discover magical spots' },
  { key: 'explorer', emoji: '🧭', name: 'Explorer', character: 'Scout', desc: 'Map the unknown and spot wildlife' },
];

export default function ThemeSelectScreen() {
  const router = useRouter();
  const { setTheme, resetHunt } = useHuntStore();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setFavorites(data.data?.familyProfile?.favorites || []);
    }).catch(() => {});
  }, []);

  function handleSelect(theme: string) {
    // ALWAYS reset hunt so a fresh one is generated
    resetHunt();
    setTheme(theme);
    router.push('/(app)/story-intro');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Choose Theme" />
      {/* Progress bar: Step 4 of 5 */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressDot, step <= 4 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pick your adventure!</Text>
        <Text style={styles.subtitle}>Each theme has a unique character & story</Text>

        {themes.map((t) => {
          const isFavorite = favorites.includes(t.key);
          return (
            <TouchableOpacity key={t.key} onPress={() => handleSelect(t.key)} activeOpacity={0.7}>
              <BeeCard style={styles.themeCard}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{t.emoji}</Text>
                </View>
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{t.name}</Text>
                  <Text style={styles.character}>with {t.character}</Text>
                  <Text style={styles.desc}>{t.desc}</Text>
                  {isFavorite && (
                    <View style={styles.favBadge}>
                      <Text style={styles.favText}>⭐ You loved this!</Text>
                    </View>
                  )}
                </View>
              </BeeCard>
            </TouchableOpacity>
          );
        })}
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
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 20, textAlign: 'center' },
  themeCard: { marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  emojiContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  emoji: { fontSize: 32 },
  themeInfo: { flex: 1 },
  themeName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text },
  character: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  desc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  favBadge: { backgroundColor: Colors.backgroundAlt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, alignSelf: 'flex-start' },
  favText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.primary },
});
