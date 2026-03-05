import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { BeeModal } from '../BeeModal';
import { BeeButton } from '../BeeButton';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';

export function ReferralModal() {
  const visible = useAppStore((s) => s.referralModalOpen);
  const setModal = useAppStore((s) => s.setModal);
  const [code, setCode] = useState('');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (visible) {
      api.get('/referrals/my-code').then(({ data }) => {
        setCode(data.data.referralCode);
        setCount(data.data.referralCount);
      }).catch(() => {});
    }
  }, [visible]);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Join me on Bumbee! Use code ${code} — your first month is free. 🐝`,
      });
    } catch {}
  }

  return (
    <BeeModal visible={visible} onClose={() => setModal('referralModalOpen', false)} title="Refer & Earn 🎁">
      <Text style={styles.subtitle}>Share Bumbee with other families!</Text>

      <TouchableOpacity onPress={handleCopy} style={styles.codeBox}>
        <Text style={styles.code}>{code || '...'}</Text>
        <Text style={styles.tapHint}>Tap to copy</Text>
      </TouchableOpacity>

      <Text style={styles.reward}>🎉 Your friend gets first month free.</Text>
      <Text style={styles.reward}>💰 You get 10% off your next renewal.</Text>
      <Text style={styles.count}>Referrals so far: {count}</Text>

      <BeeButton title="Share with Friends" onPress={handleShare} />
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', marginBottom: 16 },
  codeBox: { backgroundColor: '#FFF5E0', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  code: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.primary },
  tapHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  reward: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 4 },
  count: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.secondary, marginTop: 8, marginBottom: 20 },
});
