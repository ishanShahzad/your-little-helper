import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BeeInput } from '../../components/BeeInput';
import { BeeButton } from '../../components/BeeButton';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import api from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await login({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken }, data.data.user);
      router.replace('/(app)/ages');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebookLogin() {
    Alert.alert('Facebook Login', 'Facebook login requires native build configuration with expo-auth-session.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.bee}>🐝</Text>
      <Text style={styles.title}>Welcome back!</Text>
      <Text style={styles.subtitle}>Sign in to your Bumbee account</Text>

      <BeeInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="family@email.com" />
      <BeeInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />

      <BeeButton title="Sign In" onPress={handleLogin} loading={loading} />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      <BeeButton title="Continue with Facebook" onPress={handleFacebookLogin} variant="facebook" />

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: Colors.background },
  bee: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontFamily: 'Fredoka_600SemiBold', fontSize: 28, color: Colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary, textAlign: 'center', marginBottom: 32 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  or: { marginHorizontal: 12, fontFamily: 'Nunito_400Regular', color: Colors.secondary },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.secondary },
  linkBold: { fontFamily: 'Nunito_600SemiBold', color: Colors.primary },
});
