import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

const themes = [
  { key: 'pirate', emoji: '🏴‍☠️', name: 'Pirate', character: 'Captain Goldbeard', desc: 'Tricorn hat, eye patch, red coat' },
  { key: 'spy', emoji: '🕵️', name: 'Spy', character: 'Agent B', desc: 'Fedora, trench coat, sunglasses' },
  { key: 'fairy', emoji: '🧚', name: 'Fairy', character: 'Sparkle', desc: 'Wings, wand, crown' },
  { key: 'unicorn', emoji: '🦄', name: 'Unicorn', character: 'Stardust', desc: 'Horn, rainbow mane' },
  { key: 'explorer', emoji: '🧭', name: 'Explorer', character: 'Scout', desc: 'Safari hat, vest, compass' },
];

export default function ThemeSelectScreen() {
  const router = useRouter();
  const setTheme = useHuntStore((s) => s.setTheme);

  function handleSelect(theme: string) {
    setTheme(theme);
    router.push('/(app)/live-map');
  }

  return (
    <View style={styles.container}>
      <BeeHeader title="Choose Theme" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pick your adventure!</Text>

        {themes.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => handleSelect(t.key)} activeOpacity={0.7}>
            <BeeCard style={styles.themeCard}>
              <Text style={styles.emoji}>{t.emoji}</Text>
              <View style={styles.themeInfo}>
                <Text style={styles.themeName}>{t.name}</Text>
                <Text style={styles.character}>{t.character}</Text>
                <Text style={styles.desc}>{t.desc}</Text>
              </View>
            </BeeCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, marginBottom: 20, textAlign: 'center' },
  themeCard: { marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 40, marginRight: 16 },
  themeInfo: { flex: 1 },
  themeName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text },
  character: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  desc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
});
