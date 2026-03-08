import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { BeeHeader } from '../../components/BeeHeader';
import { BeeButton } from '../../components/BeeButton';
import { BeeLoader } from '../../components/BeeLoader';
import { useHuntStore } from '../../store/huntStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function ItinerarySetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mood, ages } = useHuntStore();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(50);
  const [transportMode, setTransportMode] = useState<'walking' | 'car'>('walking');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [environment, setEnvironment] = useState<'outdoor' | 'indoor' | 'mixed'>('mixed');

  async function handleGenerate() {
    setLoading(true);
    try {
      let lat, lng;
      if (mood !== 'rainy' && mood !== 'sick') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const { data } = await api.post('/itineraries/generate', {
        lat, 
        lng, 
        mood: mood || 'energetic', 
        ages,
        budget,
        transportMode,
        durationMinutes,
        environment,
      });
      router.push({ pathname: '/(app)/itinerary-view', params: { id: data.data._id, itinerary: JSON.stringify(data.data) } });
    } catch (err: any) {
      if (err.isNetworkError || err.isTimeout) {
        Alert.alert(
          err.isTimeout ? 'Connection Timeout' : 'No Internet Connection',
          err.userMessage || 'Please check your internet connection and try again.'
        );
      } else if (err.response?.data?.message === 'subscription_required') {
        Alert.alert('Upgrade needed', 'Upgrade to Bumbee Premium to plan unlimited family days!');
      } else {
        Alert.alert('Oops!', 'Could not generate your itinerary. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <BeeLoader message="Building your perfect day... 🗓️" />;

  const isIndoor = mood === 'rainy' || mood === 'sick';

  const checklist = isIndoor
    ? [
      { emoji: '📋', text: 'Paper & pencils for games' },
      { emoji: '📱', text: 'Phone or timer ready' },
      { emoji: '🎲', text: 'Board games nearby' },
      { emoji: '🍿', text: 'Snacks & drinks sorted' },
      { emoji: '🛋️', text: 'Cosy spot for activities' },
    ]
    : [
      { emoji: '☀️', text: 'Check the weather before going' },
      { emoji: '👟', text: 'Comfy shoes for the family' },
      { emoji: '🎒', text: 'Bag with snacks & water' },
      { emoji: '📱', text: 'Phone charged & ready to go' },
      { emoji: '😄', text: 'Bring lots of energy!' },
    ];

  return (
    <View style={styles.container}>
      <BeeHeader title="Day Planner" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: isIndoor ? Colors.purpleLight : Colors.backgroundAlt }]}>
          <Text style={styles.heroEmoji}>{isIndoor ? '🏠' : '☀️'}</Text>
          <Text style={styles.heroTitle}>{isIndoor ? 'Indoor Family Day' : 'Outdoor Adventure Day'}</Text>
          <Text style={styles.heroSubtitle}>
            {isIndoor
              ? 'A cosy, fun-filled day with activities built for your little ones'
              : 'We\u2019ll plan place visits perfectly timed for your whole family'}
          </Text>
        </View>

        {/* ── Duration Selection ── */}
        <Text style={styles.sectionLabel}>HOW LONG DO YOU HAVE?</Text>
        <View style={styles.chipRow}>
          {[60, 90, 120, 180].map((mins) => (
            <TouchableOpacity
              key={mins}
              style={[styles.chip, durationMinutes === mins && styles.chipActive]}
              onPress={() => setDurationMinutes(mins)}
            >
              <Text style={[styles.chipText, durationMinutes === mins && styles.chipTextActive]}>
                {mins === 60 ? '1h' : mins === 90 ? '1.5h' : mins === 120 ? '2h' : '3h'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Budget Selection ── */}
        <Text style={styles.sectionLabel}>WHAT'S YOUR BUDGET?</Text>
        <View style={styles.chipRow}>
          {[10, 30, 50, 100].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.chip, budget === amount && styles.chipActive]}
              onPress={() => setBudget(amount)}
            >
              <Text style={[styles.chipText, budget === amount && styles.chipTextActive]}>
                ${amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Transport Mode ── */}
        <Text style={styles.sectionLabel}>HOW WILL YOU GET AROUND?</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, transportMode === 'walking' && styles.toggleActive]}
            onPress={() => setTransportMode('walking')}
          >
            <Text style={styles.toggleEmoji}>🚶</Text>
            <Text style={[styles.toggleText, transportMode === 'walking' && styles.toggleTextActive]}>Walking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, transportMode === 'car' && styles.toggleActive]}
            onPress={() => setTransportMode('car')}
          >
            <Text style={styles.toggleEmoji}>🚗</Text>
            <Text style={[styles.toggleText, transportMode === 'car' && styles.toggleTextActive]}>Car</Text>
          </TouchableOpacity>
        </View>

        {/* ── Environment Selection ── */}
        {!isIndoor && (
          <>
            <Text style={styles.sectionLabel}>INDOOR OR OUTDOOR?</Text>
            <View style={styles.chipRow}>
              {[
                { value: 'outdoor', label: '🌳 Outdoor', emoji: '🌳' },
                { value: 'indoor', label: '🏠 Indoor', emoji: '🏠' },
                { value: 'mixed', label: '🌤️ Mixed', emoji: '🌤️' },
              ].map((env) => (
                <TouchableOpacity
                  key={env.value}
                  style={[styles.envChip, environment === env.value && styles.chipActive]}
                  onPress={() => setEnvironment(env.value as any)}
                >
                  <Text style={[styles.chipText, environment === env.value && styles.chipTextActive]}>
                    {env.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Checklist ── */}
        <Text style={styles.sectionLabel}>{isIndoor ? 'THINGS TO HAVE READY' : 'BEFORE YOU GO'}</Text>
        <View style={styles.checklist}>
          {checklist.map((item, i) => (
            <View key={i} style={[styles.checkRow, i < checklist.length - 1 && styles.checkRowBorder]}>
              <Text style={styles.checkEmoji}>{item.emoji}</Text>
              <Text style={styles.checkText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Info strip ── */}
        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Text style={styles.infoVal}>🕐 {durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}${durationMinutes % 60 ? '.5' : ''}h` : `${durationMinutes}m`}</Text>
            <Text style={styles.infoLabel}>Duration</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoVal}>💰 ${budget}</Text>
            <Text style={styles.infoLabel}>Budget</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoVal}>{transportMode === 'walking' ? '🚶' : '🚗'} {transportMode === 'walking' ? 'Walk' : 'Drive'}</Text>
            <Text style={styles.infoLabel}>Transport</Text>
          </View>
        </View>

        <BeeButton title="🐝 Build My Perfect Day!" onPress={handleGenerate} size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  hero: { borderRadius: 22, padding: 28, alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 52, marginBottom: 10 },
  heroTitle: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text, textAlign: 'center', marginBottom: 6 },
  heroSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontFamily: 'Fredoka_600SemiBold', fontSize: 12, color: Colors.secondary, letterSpacing: 1.2, marginBottom: 12, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  envChip: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleEmoji: { fontSize: 20 },
  toggleText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  toggleTextActive: {
    color: '#fff',
  },
  checklist: {
    backgroundColor: Colors.surface, borderRadius: 18, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  checkRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  checkEmoji: { fontSize: 20, width: 28 },
  checkText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textBody, flex: 1 },
  infoStrip: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 24, justifyContent: 'space-around',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  infoItem: { alignItems: 'center' },
  infoVal: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: Colors.primary, textAlign: 'center' },
  infoLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.secondary, marginTop: 4 },
  infoDivider: { width: 1, backgroundColor: Colors.borderLight },
});
