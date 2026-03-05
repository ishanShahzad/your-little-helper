import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { useAuthStore } from '../../store/authStore';
import { useHuntStore } from '../../store/huntStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function ModeSelectScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mood, resetHunt } = useHuntStore();
  const setModal = useAppStore((s) => s.setModal);
  const [profile, setProfile] = useState<any>(null);
  const [birthdayKid, setBirthdayKid] = useState<string | null>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
      const kids = data.data?.familyProfile?.kids || [];
      const now = new Date();
      for (const kid of kids) {
        if (!kid.dob) continue;
        const dob = new Date(kid.dob);
        const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        const diffDays = Math.ceil((thisYearBday.getTime() - now.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= 7) { setBirthdayKid(kid.name); break; }
      }
    } catch {}
  }

  function checkSubscriptionAndGo(path: string) {
    if (profile && profile.subscription?.plan === 'free' && (profile.history?.length || 0) >= 1) {
      setModal('subscriptionModalOpen', true);
      return;
    }
    // Always reset hunt when starting a new one
    resetHunt();
    router.push(path as any);
  }

  async function handleOneTapRepeat() {
    const lastHunt = profile?.history?.[profile.history.length - 1];
    if (!lastHunt) return;
    try {
      const { data: subData } = await api.get('/subscriptions/status');
      if (subData.data?.plan === 'free' && (profile?.history?.length || 0) >= 1) {
        setModal('subscriptionModalOpen', true);
        return;
      }
    } catch {}
    // Reset and go to map — will generate fresh hunt
    resetHunt();
    router.push('/(app)/live-map');
  }

  const streak = profile?.streaks?.currentStreak || 0;
  const hasHistory = (profile?.history?.length || 0) > 0;

  return (
    <View style={styles.container}>
      <BeeHeader title="Bumbee" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hi {user?.name || 'there'}! 👋</Text>
            <Text style={styles.title}>Ready for an adventure?</Text>
          </View>
          <TouchableOpacity onPress={() => setModal('badgeGalleryOpen', true)} style={styles.badgeBtn}>
            <Text style={styles.badgeIcon}>🏅</Text>
          </TouchableOpacity>
        </View>

        {birthdayKid && (
          <TouchableOpacity style={styles.birthdayBanner} onPress={() => {
            Alert.alert('🎂 Birthday Hunt!', `Create a special birthday adventure for ${birthdayKid}?`, [
              { text: 'Not now' },
              { text: 'Yes!', onPress: () => checkSubscriptionAndGo('/(app)/ages') },
            ]);
          }}>
            <Text style={styles.birthdayText}>🎂 {birthdayKid}'s birthday is coming! Create a special hunt?</Text>
          </TouchableOpacity>
        )}

        {streak > 0 && (
          <View style={styles.streakBar}>
            <Text style={styles.streakText}>🔥 {streak} Weekend Streak!</Text>
            {profile?.streaks?.badges?.length > 0 && (
              <Text style={styles.latestBadge}>{profile.streaks.badges[profile.streaks.badges.length - 1]}</Text>
            )}
          </View>
        )}

        {/* Main modes */}
        <TouchableOpacity onPress={() => checkSubscriptionAndGo('/(app)/ages')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeEmoji}>🗺️</Text>
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Scavenger Hunt</Text>
              <Text style={styles.modeDesc}>Themed outdoor adventure with clues, missions, and AR characters</Text>
              <View style={styles.modeSteps}>
                <Text style={styles.stepChip}>Ages → Duration → Prefs → Theme → Go!</Text>
              </View>
            </View>
          </BeeCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => checkSubscriptionAndGo('/(app)/itinerary-setup')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeEmoji}>📅</Text>
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Day Planner</Text>
              <Text style={styles.modeDesc}>
                {mood === 'rainy' || mood === 'sick' ? 'Indoor activities for the whole family' : 'Time-blocked family day itinerary'}
              </Text>
            </View>
          </BeeCard>
        </TouchableOpacity>

        {hasHistory && (
          <TouchableOpacity onPress={handleOneTapRepeat} style={styles.repeatBtn}>
            <Text style={styles.repeatIcon}>🔄</Text>
            <View>
              <Text style={styles.repeatTitle}>One-Tap Repeat</Text>
              <Text style={styles.repeatDesc}>Re-run your last adventure with fresh stops!</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(app)/journal')} style={styles.linkItem}>
            <Text style={styles.linkEmoji}>📖</Text>
            <Text style={styles.linkText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal('feedbackModalOpen', true)} style={styles.linkItem}>
            <Text style={styles.linkEmoji}>📝</Text>
            <Text style={styles.linkText}>Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal('referralModalOpen', true)} style={styles.linkItem}>
            <Text style={styles.linkEmoji}>🎁</Text>
            <Text style={styles.linkText}>Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={styles.linkItem}>
            <Text style={styles.linkEmoji}>👤</Text>
            <Text style={styles.linkText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 24 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 16 },
  badgeBtn: { padding: 8 },
  badgeIcon: { fontSize: 28 },
  birthdayBanner: { backgroundColor: Colors.backgroundAlt, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 12, padding: 14, marginBottom: 16 },
  birthdayText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  streakBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundAlt, padding: 10, borderRadius: 12, marginBottom: 16, gap: 8 },
  streakText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  latestBadge: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  modeCard: { marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  modeIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.backgroundAlt, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modeEmoji: { fontSize: 28 },
  modeTextContainer: { flex: 1 },
  modeTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 2 },
  modeDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  modeSteps: { marginTop: 6 },
  stepChip: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.primary, backgroundColor: Colors.backgroundAlt, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  repeatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundAlt, padding: 16, borderRadius: 12, marginBottom: 16, gap: 12 },
  repeatIcon: { fontSize: 28 },
  repeatTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  repeatDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
  links: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  linkItem: { alignItems: 'center', gap: 4 },
  linkEmoji: { fontSize: 22 },
  linkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary },
});
