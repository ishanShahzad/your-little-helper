import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BeeModal } from '../BeeModal';
import { BeeCard } from '../BeeCard';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

const allBadges = [
  { threshold: 3, emoji: '🌟', name: 'Getting Started', desc: 'Complete 3 weekend adventures' },
  { threshold: 7, emoji: '🔥', name: 'On Fire Family', desc: 'Complete 7 weekend adventures' },
  { threshold: 15, emoji: '🏆', name: 'Adventure Pro', desc: 'Complete 15 weekend adventures' },
  { threshold: 30, emoji: '👑', name: 'Bumbee Legends', desc: 'Complete 30 weekend adventures' },
];

export function BadgeGalleryModal() {
  const visible = useAppStore((s) => s.badgeGalleryOpen);
  const setModal = useAppStore((s) => s.setModal);
  const [streaks, setStreaks] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      api.get('/users/me/streaks').then(({ data }) => setStreaks(data.data)).catch(() => {});
    }
  }, [visible]);

  const earnedBadges = streaks?.badges || [];
  const weekendsPlanned = streaks?.weekendsPlanned || 0;

  return (
    <BeeModal visible={visible} onClose={() => setModal('badgeGalleryOpen', false)} title="Badge Gallery 🏅">
      <Text style={styles.subtitle}>Earn badges by completing weekend adventures!</Text>

      <View style={styles.grid}>
        {allBadges.map((badge) => {
          const earned = earnedBadges.some((b: string) => b.includes(badge.name));
          const remaining = Math.max(0, badge.threshold - weekendsPlanned);
          return (
            <BeeCard key={badge.name} style={[styles.badgeCard, !earned && styles.locked]}>
              <Text style={[styles.emoji, !earned && styles.emojiLocked]}>{badge.emoji}</Text>
              <Text style={[styles.badgeName, !earned && styles.textLocked]}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
              {earned ? (
                <Text style={styles.earnedText}>✅ Earned!</Text>
              ) : (
                <Text style={styles.remaining}>{remaining} weekends to go</Text>
              )}
            </BeeCard>
          );
        })}
      </View>

      {earnedBadges.length > 0 && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>🎉 Order sticker pack — coming soon!</Text>
        </View>
      )}
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, marginBottom: 16, textAlign: 'center' },
  grid: { gap: 12, paddingBottom: 20 },
  badgeCard: { alignItems: 'center', padding: 16 },
  locked: { opacity: 0.5, borderColor: Colors.grey },
  emoji: { fontSize: 40, marginBottom: 8 },
  emojiLocked: { opacity: 0.4 },
  badgeName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  textLocked: { color: Colors.grey },
  badgeDesc: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, textAlign: 'center', marginTop: 2 },
  earnedText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.green, marginTop: 6 },
  remaining: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 6 },
  cta: { backgroundColor: '#FFF5E0', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  ctaText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.primary },
});
