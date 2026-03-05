import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  message?: string;
}

export function BeeLoader({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.bee}>🐝</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  bee: { fontSize: 48, marginBottom: 16 },
  spinner: { marginBottom: 12 },
  message: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.secondary },
});
