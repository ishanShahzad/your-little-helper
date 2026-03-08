import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const themes = [
  { key: 'pirate', emoji: '🏴‍☠️', name: 'Pirate', character: 'Captain Goldbeard', desc: 'Find treasure, walk the plank, say Arrr!', bg: '#FFF7E6', accent: '#D4A017' },
  { key: 'spy', emoji: '🕵️', name: 'Spy', character: 'Agent B', desc: 'Sneak, decode, and complete secret missions', bg: '#F0F7FF', accent: Colors.primary },
  { key: 'fairy', emoji: '🧚', name: 'Fairy', character: 'Sparkle', desc: 'Find fairy dust, make wishes, and dance!', bg: '#FDF2F8', accent: '#C026D3' },
  { key: 'unicorn', emoji: '🦄', name: 'Unicorn', character: 'Stardust', desc: 'Chase rainbows and discover magical spots', bg: '#F5F3FF', accent: Colors.purple },
  { key: 'explorer', emoji: '🧭', name: 'Explorer', character: 'Scout', desc: 'Map the unknown and spot wildlife', bg: '#F0FDF4', accent: Colors.green },
];

export default function ThemeSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setTheme, resetHunt } = useHuntStore();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setFavorites(data.data?.familyProfile?.favorites || []);
    }).catch(() => { });
  }, []);

  function handleSelect(theme: string) {
    resetHunt();
    setTheme(theme);
    router.push('/(app)/story-intro');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Choose Theme" />

      {/* Progress */}
      <View style={styles.progressStrip}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={[styles.progressSeg, step <= 4 && styles.progressActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Pick your adventure! 🎭</Text>
        <Text style={styles.subline}>Each theme has a unique character, story, and clues</Text>

        {themes.map((t) => {
          const isFavorite = favorites.includes(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => handleSelect(t.key)}
              activeOpacity={0.85}
              style={styles.cardWrap}
            >
              <View style={[styles.card, { backgroundColor: t.bg, borderColor: t.accent + '44' }]}>
                <View style={[styles.emojiBox, { backgroundColor: t.accent + '22' }]}>
                  <Text style={styles.emoji}>{t.emoji}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.themeName, { color: t.accent }]}>{t.name}</Text>
                    {isFavorite && (
                      <View style={[styles.favChip, { backgroundColor: t.accent + '22' }]}>
                        <Text style={[styles.favText, { color: t.accent }]}>⭐ Loved it!</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.character}>with {t.character}</Text>
                  <Text style={styles.desc}>{t.desc}</Text>
                </View>
                <Text style={[styles.arrow, { color: t.accent }]}>→</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  subline: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 20 },
  cardWrap: { marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 16, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  emojiBox: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  themeName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 19 },
  favChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  favText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
  character: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.secondary },
  desc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2, lineHeight: 17 },
  arrow: { fontSize: 20, fontWeight: '700' },
});
