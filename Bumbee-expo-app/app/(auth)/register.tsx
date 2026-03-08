import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeeInput } from '../../components/BeeInput';
import { BeeButton } from '../../components/BeeButton';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';
import { loginWithFacebook } from '../../utils/facebookAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const setModal = useAppStore((s) => s.setModal);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !dob || !password) {
      return Alert.alert('Missing fields', 'Please fill in your name, email, date of birth, and password.');
    }
    if (!agreedTerms) {
      return Alert.alert('One more step', 'Please agree to our Terms & Privacy Policy to continue.');
    }
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return Alert.alert('Invalid date', 'Please enter your date of birth as YYYY-MM-DD.');
    }
    const age = Math.floor((Date.now() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 12) {
      return Alert.alert('Age requirement', 'You must be at least 12 years old to create a Bumbee account.');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        dob,
        password,
        referralCode: referralCode.trim() || undefined,
      });
      await login({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, data.data.user);
      router.replace('/(app)/mode-select');
    } catch (err: any) {
      if (err.isNetworkError || err.isTimeout) {
        Alert.alert(
          err.isTimeout ? 'Connection Timeout' : 'No Internet Connection',
          err.userMessage || 'Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Registration failed', err.response?.data?.message || 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
    if (!agreedTerms) {
      return Alert.alert('One more step', 'Please agree to our Terms & Privacy Policy to continue.');
    }

    setFbLoading(true);
    try {
      const result = await loginWithFacebook();

      if (result.type === 'cancel') {
        setFbLoading(false);
        return;
      }

      if (result.type === 'error') {
        Alert.alert('Facebook Login Failed', result.error || 'Unable to authenticate with Facebook');
        setFbLoading(false);
        return;
      }

      if (result.type === 'success' && result.token) {
        const { data } = await api.post('/auth/facebook', { facebookToken: result.token });
        await login({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, data.data.user);
        router.replace('/(app)/mode-select');
      }
    } catch (err: any) {
      if (err.isNetworkError || err.isTimeout) {
        Alert.alert(
          err.isTimeout ? 'Connection Timeout' : 'No Internet Connection',
          err.userMessage || 'Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Facebook Login Failed', err.response?.data?.message || 'Unable to complete Facebook authentication');
      }
    } finally {
      setFbLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image source={require('../../assets/bumbee-logo.png')} style={styles.logo} />
          <Text style={styles.title}>Join Bumbee! 🐝</Text>
          <Text style={styles.subtitle}>Create magical family adventures together</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.formCard}>
          <BeeInput label="Full name" value={name} onChangeText={setName} placeholder="e.g. The Smith Family" />
          <BeeInput
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="family@email.com"
          />
          <BeeInput
            label="Date of birth (YYYY-MM-DD)"
            value={dob}
            onChangeText={setDob}
            placeholder="1990-01-15"
            keyboardType="numbers-and-punctuation"
          />
          <BeeInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min 6 characters"
          />
          <BeeInput
            label="Referral code (optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="BEE-XXXXXX"
            autoCapitalize="characters"
          />

          {/* ── Agree terms ── */}
          <TouchableOpacity
            style={[styles.termsBox, agreedTerms && styles.termsBoxActive]}
            onPress={() => setAgreedTerms(!agreedTerms)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreedTerms && styles.checkboxActive]}>
              {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => setModal('termsModalOpen', true)}>Terms</Text>
              {' & '}
              <Text style={styles.termsLink} onPress={() => setModal('privacyModalOpen', true)}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <BeeButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={!agreedTerms}
            style={styles.createBtn}
          />
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or</Text>
          <View style={styles.divLine} />
        </View>

        {/* ── Facebook ── */}
        <BeeButton
          title="Continue with Facebook"
          icon="f"
          onPress={handleFacebookLogin}
          loading={fbLoading}
          disabled={!agreedTerms}
          variant="facebook"
          style={styles.fbBtn}
        />

        {/* ── Switch to login ── */}
        <TouchableOpacity onPress={() => router.back()} style={styles.switchLink}>
          <Text style={styles.switchText}>
            Already have an account?{'  '}
            <Text style={styles.switchBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, backgroundColor: Colors.background },

  hero: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 14 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary, textAlign: 'center', marginTop: 4 },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: Colors.primaryDeep, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  termsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background, marginBottom: 16,
  },
  termsBoxActive: { borderColor: Colors.primary, backgroundColor: Colors.backgroundAlt },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  termsText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textBody, flex: 1 },
  termsLink: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
  createBtn: {},

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { marginHorizontal: 14, fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  fbBtn: { marginBottom: 20 },

  switchLink: { alignItems: 'center' },
  switchText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  switchBold: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
});
