import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { useAuthStore } from '../../store/authStore';
import { useHuntStore } from '../../store/huntStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function ModeSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    } catch { }
  }

  function checkSubscriptionAndGo(path: string) {
    if (profile && profile.subscription?.plan === 'free' && (profile.history?.length || 0) >= 1) {
      setModal('subscriptionModalOpen', true);
      return;
    }
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
    } catch { }
    resetHunt();
    router.push('/(app)/live-map');
  }

  const streak = profile?.streaks?.currentStreak || 0;
  const hasHistory = (profile?.history?.length || 0) > 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      <BeeHeader title="Bumbee" showBack={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subtitle}>What adventure shall we create today?</Text>
        </View>

        {/* ── Birthday banner ── */}
        {birthdayKid && (
          <TouchableOpacity
            style={styles.birthdayBanner}
            onPress={() => Alert.alert('🎂 Birthday Hunt!', `Create a special adventure for ${birthdayKid}?`, [
              { text: 'Not now' },
              { text: 'Yes!', onPress: () => checkSubscriptionAndGo('/(app)/ages') },
            ])}
          >
            <Text style={styles.birthdayEmoji}>🎂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.birthdayTitle}>{birthdayKid}'s birthday is coming!</Text>
              <Text style={styles.birthdayHint}>Tap to create a special birthday hunt →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Streak bar ── */}
        {streak > 0 && (
          <View style={styles.streakBar}>
            <Text style={styles.streakFire}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>{streak}-Weekend Streak!</Text>
              {profile?.streaks?.badges?.length > 0 && (
                <Text style={styles.streakBadge}>{profile.streaks.badges[profile.streaks.badges.length - 1]}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setModal('badgeGalleryOpen', true)} style={styles.badgeBtn}>
              <Text style={styles.badgeBtnText}>🏅 Badges</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Section label ── */}
        <Text style={styles.sectionLabel}>Choose your adventure</Text>

        {/* ── Scavenger Hunt ── */}
        <TouchableOpacity
          onPress={() => checkSubscriptionAndGo('/(app)/ages')}
          activeOpacity={0.85}
          style={styles.modeCardWrap}
        >
          <View style={[styles.modeCard, styles.modeCardHunt]}>
            <View style={styles.modeCardLeft}>
              <View style={[styles.modeIconCircle, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Text style={styles.modeIconText}>🗺️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modeCardTitle}>Scavenger Hunt</Text>
                <Text style={styles.modeCardDesc}>Themed outdoor clues, missions & AR characters</Text>
                <View style={styles.tagRow}>
                  <View style={styles.tag}><Text style={styles.tagText}>📍 GPS stops</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>📸 Photos</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>🏆 Finale</Text></View>
                </View>
              </View>
            </View>
            <Text style={styles.modeArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* ── Day Planner ── */}
        <TouchableOpacity
          onPress={() => checkSubscriptionAndGo('/(app)/itinerary-setup')}
          activeOpacity={0.85}
          style={styles.modeCardWrap}
        >
          <BeeCard style={styles.modeCardPlanner} variant="elevated">
            <View style={styles.modeCardLeft}>
              <View style={[styles.modeIconCircle, { backgroundColor: Colors.backgroundAlt }]}>
                <Text style={styles.modeIconText}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeCardTitle, { color: Colors.text }]}>Day Planner</Text>
                <Text style={[styles.modeCardDesc, { color: Colors.secondary }]}>
                  {mood === 'rainy' || mood === 'sick'
                    ? 'Indoor activities for the whole family'
                    : 'Time-blocked family day itinerary'}
                </Text>
              </View>
            </View>
            <Text style={[styles.modeArrow, { color: Colors.primary }]}>→</Text>
          </BeeCard>
        </TouchableOpacity>

        {/* ── One-tap repeat ── */}
        {hasHistory && (
          <TouchableOpacity onPress={handleOneTapRepeat} activeOpacity={0.85}>
            <View style={styles.repeatCard}>
              <Text style={styles.repeatIcon}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.repeatTitle}>One-Tap Repeat</Text>
                <Text style={styles.repeatDesc}>Re-run your last adventure with fresh stops!</Text>
              </View>
              <Text style={styles.repeatArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Quick links ── */}
        <Text style={styles.sectionLabel}>Quick links</Text>
        <View style={styles.quickGrid}>
          {[
            { emoji: '📖', label: 'Journal', onPress: () => router.push('/(app)/journal') },
            { emoji: '📝', label: 'Feedback', onPress: () => setModal('feedbackModalOpen', true) },
            { emoji: '🎁', label: 'Refer', onPress: () => setModal('referralModalOpen', true) },
            { emoji: '👤', label: 'Profile', onPress: () => router.push('/(app)/profile') },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickItem} onPress={item.onPress} activeOpacity={0.75}>
              <View style={styles.quickIconBox}>
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },

  greetingBlock: { marginBottom: 20 },
  greeting: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.secondary, marginTop: 2 },

  birthdayBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.yellowLight, borderRadius: 16,
    padding: 14, marginBottom: 14,
    borderWidth: 1.5, borderColor: Colors.yellow,
  },
  birthdayEmoji: { fontSize: 28 },
  birthdayTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 15, color: Colors.text },
  birthdayHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },

  streakBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 14, marginBottom: 14, gap: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  streakFire: { fontSize: 28 },
  streakTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  streakBadge: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  badgeBtn: { backgroundColor: Colors.backgroundAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.primary },

  sectionLabel: {
    fontFamily: 'Fredoka_600SemiBold', fontSize: 13, color: Colors.secondary,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 6,
  },

  modeCardWrap: { marginBottom: 14 },
  modeCard: {
    borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center',
  },
  modeCardHunt: {
    backgroundColor: Colors.primaryDeep,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  modeCardPlanner: { flexDirection: 'row', alignItems: 'center' },
  modeCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 },
  modeIconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modeIconText: { fontSize: 26 },
  modeCardTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 20, color: '#fff', marginBottom: 2 },
  modeCardDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 8, lineHeight: 18 },
  modeArrow: { fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginLeft: 8 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.9)' },

  repeatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  repeatIcon: { fontSize: 28 },
  repeatTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  repeatDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 2 },
  repeatArrow: { fontSize: 18, color: Colors.grey },

  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  quickItem: { flex: 1, alignItems: 'center' },
  quickIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    marginBottom: 6, borderWidth: 1, borderColor: Colors.borderLight,
  },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.secondary },
});
