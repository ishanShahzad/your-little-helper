import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, View,
} from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'facebook' | 'ghost' | 'danger';
  style?: any;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export function BeeButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  size = 'md',
  icon,
}: Props) {
  const config = {
    primary: { bg: Colors.primary, text: '#fff', border: 'transparent' },
    secondary: { bg: Colors.surface, text: Colors.primary, border: Colors.primary },
    accent: { bg: Colors.accent, text: Colors.text, border: 'transparent' },
    facebook: { bg: Colors.facebook, text: '#fff', border: 'transparent' },
    ghost: { bg: 'transparent', text: Colors.primary, border: Colors.border },
    danger: { bg: '#FEF2F2', text: Colors.error, border: Colors.error },
  }[variant];

  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 14, md: 16, lg: 18 };
  const radii = { sm: 12, md: 26, lg: 30 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: config.border !== 'transparent' ? 1.5 : 0,
          opacity: disabled ? 0.48 : 1,
          height: heights[size],
          borderRadius: radii[size],
        },
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={config.text} />
      ) : (
        <View style={styles.inner}>
          {icon ? <Text style={[styles.icon, { color: config.text }]}>{icon}</Text> : null}
          <Text style={[styles.text, { color: config.text, fontSize: fontSizes[size] }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Subtle shadow on primary
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Fredoka_600SemiBold' },
  icon: { fontSize: 18 },
});
