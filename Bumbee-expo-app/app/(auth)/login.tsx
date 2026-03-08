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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const setModal = useAppStore((s) => s.setModal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert('Oops!', 'Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
      await login({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, data.data.user);
      router.replace('/(app)/mode-select');
    } catch (err: any) {
      if (err.isNetworkError || err.isTimeout) {
        Alert.alert(
          err.isTimeout ? 'Connection Timeout' : 'No Internet Connection',
          err.userMessage || 'Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Sign in failed', err.response?.data?.message || 'Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image source={require('../../assets/bumbee-logo.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome back! 🐝</Text>
          <Text style={styles.subtitle}>Sign in to continue your family adventures</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.formCard}>
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
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <BeeButton title="Sign In" onPress={handleLogin} loading={loading} style={styles.signInBtn} />
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
          variant="facebook"
        />

        {/* ── Footer ── */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.switchLink}>
          <Text style={styles.switchText}>
            Don't have an account?{'  '}
            <Text style={styles.switchBold}>Sign up for free</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.legal}>
          <TouchableOpacity onPress={() => setModal('termsModalOpen', true)}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}> · </Text>
          <TouchableOpacity onPress={() => setModal('privacyModalOpen', true)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, backgroundColor: Colors.background },

  hero: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 88, height: 88, borderRadius: 22, marginBottom: 18,
    shadowColor: Colors.primaryDeep, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16
  },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 30, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.secondary, textAlign: 'center', marginTop: 4 },

  formCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: Colors.primaryDeep, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  signInBtn: { marginTop: 4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { marginHorizontal: 14, fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },

  switchLink: { marginTop: 24, alignItems: 'center' },
  switchText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  switchBold: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary },

  legal: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  legalLink: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.primary, textDecorationLine: 'underline' },
  legalDot: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary },
});
