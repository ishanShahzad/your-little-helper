import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/colors';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  rightIcon?: { label: string; onPress: () => void };
}

export function BeeInput({ label, error, hint, rightIcon, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        focused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.secondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={rightIcon.onPress} style={styles.rightIconBtn}>
            <Text style={styles.rightIconText}>{rightIcon.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>⚠ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.textBody, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperError: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  input: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.text,
  },
  rightIconBtn: { padding: 4 },
  rightIconText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.primary },
  hint: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.secondary, marginTop: 4 },
  error: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: Colors.error, marginTop: 4 },
});
