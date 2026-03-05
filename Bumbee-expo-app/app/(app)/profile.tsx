import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeCard } from '../../components/BeeCard';
import { BeeLoader } from '../../components/BeeLoader';
import { BeeButton } from '../../components/BeeButton';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (profile?.referralCode) {
      await Clipboard.setStringAsync(profile.referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    }
  }

  if (loading) return <BeeLoader message="Loading profile..." />;

  return (
    <View style={styles.container}>
      <BeeHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{user?.name || profile?.name}</Text>
        <Text style={styles.email}>{user?.email || profile?.email}</Text>
        <Text style={styles.planBadge}>
          {profile?.subscription?.plan === 'free' ? '🆓 Free' : profile?.subscription?.plan === 'monthly' ? '💎 Monthly' : '👑 Annual'}
        </Text>

        {profile?.familyProfile?.kids?.length > 0 && (
          <BeeCard style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Kids</Text>
            {profile.familyProfile.kids.map((kid: any, i: number) => (
              <Text key={i} style={styles.kidText}>{kid.name} — age {Math.floor((Date.now() - new Date(kid.dob).getTime()) / (365.25*24*60*60*1000))}</Text>
            ))}
          </BeeCard>
        )}

        <BeeCard style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Streaks</Text>
          <Text style={styles.streakText}>Current Streak: {profile?.streaks?.currentStreak || 0} weekends</Text>
          <Text style={styles.streakText}>Total Weekends: {profile?.streaks?.weekendsPlanned || 0}</Text>
          {(profile?.streaks?.badges || []).map((b: string, i: number) => (
            <Text key={i} style={styles.badgeText}>{b}</Text>
          ))}
        </BeeCard>

        <BeeCard style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Referral Code</Text>
          <TouchableOpacity onPress={copyCode}>
            <Text style={styles.referralCode}>{profile?.referralCode || 'N/A'}</Text>
          </TouchableOpacity>
          <Text style={styles.referralHint}>Tap to copy · Referrals: {profile?.referralCount || 0}</Text>
        </BeeCard>

        <BeeButton title="Logout" onPress={logout} variant="secondary" style={styles.logoutBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 24 },
  name: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, textAlign: 'center' },
  email: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', marginBottom: 4 },
  planBadge: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary, textAlign: 'center', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 8 },
  kidText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 4 },
  streakText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 4 },
  badgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  referralCode: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.primary, textAlign: 'center', paddingVertical: 12, backgroundColor: Colors.backgroundAlt, borderRadius: 12 },
  referralHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, textAlign: 'center', marginTop: 8 },
  logoutBtn: { marginTop: 24 },
});
