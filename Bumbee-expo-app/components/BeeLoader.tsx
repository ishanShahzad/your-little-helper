import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  message?: string;
}

export function BeeLoader({ message }: Props) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/bumbee-logo.png')} style={styles.logo} />
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 16 },
  spinner: { marginBottom: 12 },
  message: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary },
});
