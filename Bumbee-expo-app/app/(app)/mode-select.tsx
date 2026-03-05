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
  const mood = useHuntStore((s) => s.mood);
  const setModal = useAppStore((s) => s.setModal);
  const [profile, setProfile] = useState<any>(null);
  const [birthdayKid, setBirthdayKid] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
      // Birthday detection
      const kids = data.data?.familyProfile?.kids || [];
      const now = new Date();
      for (const kid of kids) {
        if (!kid.dob) continue;
        const dob = new Date(kid.dob);
        const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        const diffDays = Math.ceil((thisYearBday.getTime() - now.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays <= 7) {
          setBirthdayKid(kid.name);
          break;
        }
      }
    } catch {}
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
    router.push('/(app)/live-map');
  }

  function checkSubscriptionAndGo(path: string) {
    if (profile && profile.subscription?.plan === 'free' && (profile.history?.length || 0) >= 1) {
      setModal('subscriptionModalOpen', true);
      return;
    }
    router.push(path as any);
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
            <Text style={styles.title}>What shall we do today?</Text>
          </View>
          <TouchableOpacity onPress={() => setModal('badgeGalleryOpen', true)} style={styles.badgeBtn}>
            <Text style={styles.badgeIcon}>🏅</Text>
          </TouchableOpacity>
        </View>

        {/* Birthday banner */}
        {birthdayKid && (
          <TouchableOpacity
            style={styles.birthdayBanner}
            onPress={() => {
              Alert.alert('🎂 Birthday Hunt!', `Create a special birthday adventure for ${birthdayKid}?`, [
                { text: 'Not now' },
                { text: 'Yes!', onPress: () => checkSubscriptionAndGo('/(app)/hunt-prefs') },
              ]);
            }}
          >
            <Text style={styles.birthdayText}>🎂 {birthdayKid}'s birthday is coming! Create a special birthday hunt?</Text>
          </TouchableOpacity>
        )}

        {/* Streak bar */}
        {streak > 0 && (
          <View style={styles.streakBar}>
            <Text style={styles.streakText}>🔥 {streak} Weekend Streak!</Text>
            {profile?.streaks?.badges?.length > 0 && (
              <Text style={styles.latestBadge}>{profile.streaks.badges[profile.streaks.badges.length - 1]}</Text>
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => checkSubscriptionAndGo('/(app)/hunt-prefs')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <Text style={styles.modeEmoji}>🗺️</Text>
            <Text style={styles.modeTitle}>Scavenger Hunt</Text>
            <Text style={styles.modeDesc}>Themed outdoor adventure with clues and AR photos</Text>
          </BeeCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => checkSubscriptionAndGo('/(app)/itinerary-setup')} activeOpacity={0.7}>
          <BeeCard style={styles.modeCard}>
            <Text style={styles.modeEmoji}>📅</Text>
            <Text style={styles.modeTitle}>Day Planner</Text>
            <Text style={styles.modeDesc}>
              {mood === 'rainy' || mood === 'sick' ? 'Indoor activities for the whole family' : 'Time-blocked outdoor itinerary'}
            </Text>
          </BeeCard>
        </TouchableOpacity>

        {/* One-tap repeat */}
        {hasHistory && (
          <TouchableOpacity onPress={handleOneTapRepeat} style={styles.repeatBtn}>
            <Text style={styles.repeatText}>🔄 One-Tap Repeat — re-run your last adventure with fresh stops!</Text>
          </TouchableOpacity>
        )}

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push('/(app)/journal')}>
            <Text style={styles.linkText}>📖 Family Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal('feedbackModalOpen', true)}>
            <Text style={styles.linkText}>📝 Give Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModal('referralModalOpen', true)}>
            <Text style={styles.linkText}>🎁 Refer & Earn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomLinks}>
          {/* Nearby Families — commented out for now */}
          {/* <TouchableOpacity onPress={() => setModal('nearbyModalOpen', true)}>
            <Text style={styles.linkText}>👋 Nearby Families</Text>
          </TouchableOpacity> */}
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
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text, marginBottom: 16 },
  badgeBtn: { padding: 8 },
  badgeIcon: { fontSize: 28 },
  birthdayBanner: { backgroundColor: '#FFF0D0', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, padding: 14, marginBottom: 16 },
  birthdayText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, textAlign: 'center' },
  streakBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5E0', padding: 10, borderRadius: 12, marginBottom: 16, gap: 8 },
  streakText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.primary },
  latestBadge: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text },
  modeCard: { marginBottom: 16 },
  modeEmoji: { fontSize: 40, marginBottom: 8 },
  modeTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: Colors.text, marginBottom: 4 },
  modeDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  repeatBtn: { backgroundColor: '#FFF5E0', padding: 14, borderRadius: 14, marginBottom: 16, alignItems: 'center' },
  repeatText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary, textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  bottomLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
});
