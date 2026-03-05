import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeInput } from '../../components/BeeInput';
import { BeeButton } from '../../components/BeeButton';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setModal = useAppStore((s) => s.setModal);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !dob || !password) return Alert.alert('Oops!', 'Please fill in all required fields');
    if (!agreedTerms) return Alert.alert('One more thing', 'You need to agree to our Terms & Privacy Policy');

    const dobDate = new Date(dob);
    const age = Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 12) return Alert.alert('Age Requirement', 'You must be at least 12 years old to use the Bumbee app');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, dob, password, referralCode: referralCode || undefined });
      Alert.alert('You\'re all set! 🐝', `Your referral code is: ${data.data.user.referralCode}\nShare it with friends!`);
      await login({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, data.data.user);
      router.replace('/(app)/ages');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.response?.data?.message || "Let's fix that together.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/bumbee-logo.png')} style={styles.logo} />
      <Text style={styles.title}>Join Bumbee!</Text>
      <Text style={styles.subtitle}>Create magical family adventures</Text>

      <BeeInput label="Full Name" value={name} onChangeText={setName} placeholder="The Smith Family" />
      <BeeInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="family@email.com" />
      <BeeInput label="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} placeholder="1990-01-15" />
      <BeeInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 6 characters" />
      <BeeInput label="Referral Code (optional)" value={referralCode} onChangeText={setReferralCode} placeholder="BEE-XXXXXX" autoCapitalize="characters" />

      <View style={styles.termsRow}>
        <Switch value={agreedTerms} onValueChange={setAgreedTerms} trackColor={{ true: Colors.primary }} />
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink} onPress={() => setModal('termsModalOpen', true)}>Terms</Text>
          {' & '}
          <Text style={styles.termsLink} onPress={() => setModal('privacyModalOpen', true)}>Privacy Policy</Text>
        </Text>
      </View>

      <BeeButton title="Create Account" onPress={handleRegister} loading={loading} disabled={!agreedTerms} />

      <TouchableOpacity onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: Colors.white },
  logo: { width: 80, height: 80, borderRadius: 16, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary, textAlign: 'center', marginBottom: 24 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  termsText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, marginLeft: 8, flex: 1 },
  termsLink: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary, textDecorationLine: 'underline' },
  link: { marginTop: 24, alignItems: 'center', paddingBottom: 40 },
  linkText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  linkBold: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
});
