import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BeeModal } from '../BeeModal';
import { BeeLoader } from '../BeeLoader';
import { BeeCard } from '../BeeCard';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import * as Location from 'expo-location';
import api from '../../services/api';

export function NearbyModal() {
  const visible = useAppStore((s) => s.nearbyModalOpen);
  const setModal = useAppStore((s) => s.setModal);
  const setChatRoomId = useAppStore((s) => s.setChatRoomId);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState<any[]>([]);

  useEffect(() => {
    if (visible) checkNearby();
  }, [visible]);

  async function checkNearby() {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { data } = await api.post('/nearby/check', {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
      setNearby(data.data || []);
    } catch {
      setNearby([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSayHi(family: any) {
    try {
      const { data } = await api.post('/nearby/wave', { toUserId: family.userId });
      const roomId = data.data?.roomId;
      if (!roomId) throw new Error('No room ID returned');
      setChatRoomId(roomId);
      setModal('nearbyModalOpen', false);
      setModal('chatModalOpen', true);
    } catch {
      Alert.alert('Could not connect', 'Please try again in a moment.');
    }
  }

  function handleReport(family: any) {
    Alert.alert(
      '🚩 Report Family',
      `Are you sure you want to report ${family.name || 'this family'}? They won't be able to see you nearby anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/nearby/report', {
                reportedUserId: family.userId,
                reason: 'reported by user',
              });
              setNearby((prev) => prev.filter((f) => f.userId !== family.userId));
              Alert.alert('Reported', 'Thank you. We\'ll review this shortly.');
            } catch {
              Alert.alert('Error', 'Could not submit report. Try again later.');
            }
          },
        },
      ],
    );
  }

  return (
    <BeeModal visible={visible} onClose={() => setModal('nearbyModalOpen', false)} title="Nearby Families 👋">
      <Text style={styles.privacy}>🔒 You're seeing verified Bumbee families within 500m. Names only.</Text>

      {loading ? (
        <BeeLoader message="Scanning nearby..." />
      ) : nearby.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏜️</Text>
          <Text style={styles.emptyText}>No families nearby right now</Text>
          <Text style={styles.emptyHint}>Keep adventuring — you might cross paths soon!</Text>
        </View>
      ) : (
        nearby.map((fam, i) => (
          <BeeCard key={i} style={styles.familyCard}>
            <View style={styles.familyRow}>
              <View>
                <Text style={styles.familyName}>{fam.name || 'A Bumbee Family'}</Text>
                <Text style={styles.distance}>{Math.round(fam.distance)}m away</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.hiBtn} onPress={() => handleSayHi(fam)}>
                  <Text style={styles.hiText}>👋 Say Hi!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportBtn} onPress={() => handleReport(fam)}>
                  <Text style={styles.reportText}>🚩</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BeeCard>
        ))
      )}
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  privacy: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, textAlign: 'center', marginBottom: 16, backgroundColor: Colors.backgroundAlt, padding: 10, borderRadius: 8 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  emptyHint: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 4, textAlign: 'center' },
  familyCard: { marginBottom: 10 },
  familyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  familyName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  distance: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hiBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  hiText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  reportBtn: { padding: 8 },
  reportText: { fontSize: 18 },
});
