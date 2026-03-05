import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../constants/colors';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function BeeInput({ label, error, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={Colors.secondary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.backgroundAlt,
  },
  inputError: { borderColor: Colors.error },
  error: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.error, marginTop: 4 },
});
