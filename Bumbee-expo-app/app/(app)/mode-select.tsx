import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { useAuthStore } from '../../store/authStore';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';

export default function ModeSelectScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const mood = useHuntStore((s) => s.mood);

  return (
    <View style={styles.container}>
      <BeeHeader title="Bumbee" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hi {user?.name || 'there'}! 👋</Text>
        <Text style={styles.title}>What shall we do today?</Text>

        <TouchableOpacity onPress={() => router.push('/(app)/hunt-prefs')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <Text style={styles.modeEmoji}>🗺️</Text>
            <Text style={styles.modeTitle}>Scavenger Hunt</Text>
            <Text style={styles.modeDesc}>Themed outdoor adventure with clues and AR photos</Text>
          </BeeCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(app)/itinerary-setup')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <Text style={styles.modeEmoji}>📅</Text>
            <Text style={styles.modeTitle}>Day Planner</Text>
            <Text style={styles.modeDesc}>
              {mood === 'rainy' || mood === 'sick' ? 'Indoor activities for the whole family' : 'Time-blocked outdoor itinerary'}
            </Text>
          </BeeCard>
        </TouchableOpacity>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(app)/journal')}>
            <Text style={styles.linkText}>📖 Family Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
            <Text style={styles.linkText}>👤 Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24 },
  greeting: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 24 },
  modeCard: { marginBottom: 16 },
  modeEmoji: { fontSize: 40, marginBottom: 8 },
  modeTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 4 },
  modeDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  links: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
  linkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
});
