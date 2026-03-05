import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BeeModal } from '../BeeModal';
import { BeeButton } from '../BeeButton';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { useLocale } from '../../hooks/useLocale';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export function SubscriptionModal() {
  const visible = useAppStore((s) => s.subscriptionModalOpen);
  const setModal = useAppStore((s) => s.setModal);
  const { currencySymbol } = useLocale();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const monthlyPrice = `${currencySymbol}9.97`;
  const annualPrice = `${currencySymbol}59.97`;

  async function handleSubscribe() {
    setLoading(true);
    try {
      const { data } = await api.post('/subscriptions/create-checkout', { plan: selectedPlan });
      // In production, use Stripe SDK to confirm payment with data.data.clientSecret
      Alert.alert('Subscription', 'Payment flow would open here with Stripe SDK. Client secret received.');
      setModal('subscriptionModalOpen', false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not start subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <BeeModal visible={visible} onClose={() => setModal('subscriptionModalOpen', false)} title="Go Premium 🐝">
      <Text style={styles.headline}>Unlock unlimited adventures!</Text>

      <View style={styles.plans}>
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planSelected]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>{monthlyPrice}/mo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'annual' && styles.planSelected]}
          onPress={() => setSelectedPlan('annual')}
        >
          <View style={styles.bestValue}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
          <Text style={styles.planName}>Annual</Text>
          <Text style={styles.planPrice}>{annualPrice}/yr</Text>
          <Text style={styles.planSave}>First month FREE!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.feature}>✅ Unlimited scavenger hunts</Text>
        <Text style={styles.feature}>✅ Unlimited day planners</Text>
        <Text style={styles.feature}>✅ AR photo characters</Text>
        <Text style={styles.feature}>✅ Shareable recap cards</Text>
        <Text style={styles.feature}>✅ Family streak tracking</Text>
      </View>

      <BeeButton title="Subscribe Now" onPress={handleSubscribe} loading={loading} />

      <TouchableOpacity onPress={() => setModal('subscriptionModalOpen', false)} style={styles.later}>
        <Text style={styles.laterText}>Maybe later</Text>
      </TouchableOpacity>
    </BeeModal>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text, textAlign: 'center', marginBottom: 20 },
  plans: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 16, padding: 16, alignItems: 'center' },
  planSelected: { borderColor: Colors.primary, backgroundColor: '#FFF5E0' },
  bestValue: { position: 'absolute', top: -10, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  bestValueText: { fontFamily: 'Fredoka_600SemiBold', fontSize: 10, color: '#fff' },
  planName: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.text, marginTop: 8 },
  planPrice: { fontFamily: 'Nunito_600SemiBold', fontSize: 20, color: Colors.primary, marginTop: 4 },
  planSave: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.green, marginTop: 4 },
  features: { marginBottom: 20 },
  feature: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginBottom: 6 },
  later: { alignItems: 'center', marginTop: 12, paddingBottom: 20 },
  laterText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
});
