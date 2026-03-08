import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput,
} from 'react-native';
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editKids, setEditKids] = useState<{ name: string; dob: string }[]>([]);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
    } catch { } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    setEditName(profile?.name || '');
    setEditKids(
      (profile?.familyProfile?.kids || []).map((k: any) => ({
        name: k.name || '',
        dob: k.dob ? new Date(k.dob).toISOString().split('T')[0] : '',
      }))
    );
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', {
        name: editName,
        'familyProfile.kids': editKids.filter((k) => k.name).map((k) => ({
          name: k.name,
          dob: k.dob || undefined,
        })),
      });
      setProfile(data.data);
      setEditing(false);
      Alert.alert('Saved! ✅', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  }

  function addKid() {
    if (editKids.length >= 6) return;
    setEditKids([...editKids, { name: '', dob: '' }]);
  }

  function updateKid(i: number, field: 'name' | 'dob', value: string) {
    const next = [...editKids];
    next[i] = { ...next[i], [field]: value };
    setEditKids(next);
  }

  function removeKid(i: number) {
    setEditKids(editKids.filter((_, idx) => idx !== i));
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

        {/* ── Identity ── */}
        {editing ? (
          <BeeCard style={styles.section}>
            <Text style={styles.sectionTitle}>✏️ Edit Profile</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={Colors.secondary}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Kids</Text>
            {editKids.map((kid, i) => (
              <View key={i} style={styles.kidRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={kid.name}
                  onChangeText={(v) => updateKid(i, 'name', v)}
                  placeholder="Name"
                  placeholderTextColor={Colors.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 110 }]}
                  value={kid.dob}
                  onChangeText={(v) => updateKid(i, 'dob', v)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.secondary}
                />
                <TouchableOpacity onPress={() => removeKid(i)}>
                  <Text style={styles.removeKid}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {editKids.length < 6 && (
              <TouchableOpacity onPress={addKid} style={styles.addKidBtn}>
                <Text style={styles.addKidText}>+ Add child</Text>
              </TouchableOpacity>
            )}

            <View style={styles.editActions}>
              <BeeButton title="Save Changes" onPress={saveEdit} loading={saving} style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BeeCard>
        ) : (
          <>
            <View style={styles.identityRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profile?.name || user?.name}</Text>
                <Text style={styles.email}>{profile?.email || user?.email}</Text>
                <Text style={styles.planBadge}>
                  {profile?.subscription?.plan === 'free'
                    ? '🆓 Free'
                    : profile?.subscription?.plan === 'monthly'
                      ? '💎 Monthly'
                      : '👑 Annual'}
                </Text>
              </View>
              <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>

            {profile?.familyProfile?.kids?.length > 0 && (
              <BeeCard style={styles.section}>
                <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Kids</Text>
                {profile.familyProfile.kids.map((kid: any, i: number) => {
                  const ageMs = kid.dob ? Date.now() - new Date(kid.dob).getTime() : null;
                  const age = ageMs ? Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000)) : null;
                  return (
                    <Text key={i} style={styles.kidText}>
                      {kid.name}{age !== null ? ` — age ${age}` : ''}
                    </Text>
                  );
                })}
              </BeeCard>
            )}
          </>
        )}

        {/* ── Streaks ── */}
        {!editing && (
          <BeeCard style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Streaks</Text>
            <Text style={styles.streakText}>Current Streak: {profile?.streaks?.currentStreak || 0} weekends</Text>
            <Text style={styles.streakText}>Total Weekends: {profile?.streaks?.weekendsPlanned || 0}</Text>
            {(profile?.streaks?.badges || []).map((b: string, i: number) => (
              <Text key={i} style={styles.badgeText}>{b}</Text>
            ))}
          </BeeCard>
        )}

        {/* ── Referral ── */}
        {!editing && (
          <BeeCard style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 Referral Code</Text>
            <TouchableOpacity onPress={copyCode}>
              <Text style={styles.referralCode}>{profile?.referralCode || 'N/A'}</Text>
            </TouchableOpacity>
            <Text style={styles.referralHint}>Tap to copy · Referrals: {profile?.referralCount || 0}</Text>
          </BeeCard>
        )}

        <BeeButton title="Logout" onPress={logout} variant="secondary" style={styles.logoutBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 24 },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  name: { fontFamily: 'Fredoka_600SemiBold', fontSize: 26, color: Colors.text },
  email: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginBottom: 4 },
  planBadge: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  editBtn: { backgroundColor: Colors.backgroundAlt, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 4 },
  editBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  section: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 8 },
  kidText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 4 },
  streakText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 4 },
  badgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  referralCode: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.primary, textAlign: 'center', paddingVertical: 12, backgroundColor: Colors.backgroundAlt, borderRadius: 12 },
  referralHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, textAlign: 'center', marginTop: 8 },
  logoutBtn: { marginTop: 24 },
  // Edit mode
  fieldLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.secondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, height: 42, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 8 },
  kidRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  removeKid: { fontSize: 18, color: Colors.error, padding: 4 },
  addKidBtn: { alignItems: 'center', paddingVertical: 10 },
  addKidText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.secondary },
});
