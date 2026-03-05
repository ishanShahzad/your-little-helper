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

  function handleSayHi(family: any) {
    Alert.alert('👋 Say Hi!', `You waved at ${family.name}! Both families must accept before chat opens.`);
    setModal('nearbyModalOpen', false);
    setModal('chatModalOpen', true);
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
                <Text style={styles.familyName}>{fam.name}</Text>
                <Text style={styles.distance}>{Math.round(fam.distance)}m away</Text>
              </View>
              <TouchableOpacity style={styles.hiBtn} onPress={() => handleSayHi(fam)}>
                <Text style={styles.hiText}>👋 Say Hi!</Text>
              </TouchableOpacity>
            </View>
          </BeeCard>
        ))
      )}

      <TouchableOpacity style={styles.reportBtn}>
        <Text style={styles.reportText}>Report / Block</Text>
      </TouchableOpacity>
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  privacy: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, textAlign: 'center', marginBottom: 16, backgroundColor: '#FFF5E0', padding: 10, borderRadius: 8 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  emptyHint: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary, marginTop: 4 },
  familyCard: { marginBottom: 10 },
  familyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  familyName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text },
  distance: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  hiBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  hiText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 14, color: '#fff' },
  reportBtn: { alignItems: 'center', paddingVertical: 16 },
  reportText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error },
});
