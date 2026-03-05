import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'facebook';
  style?: ViewStyle;
}

export function BeeButton({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const bg =
    variant === 'facebook' ? Colors.facebook :
    variant === 'accent' ? Colors.accent :
    variant === 'secondary' ? Colors.white :
    Colors.primary;
  const textColor =
    variant === 'secondary' ? Colors.primary :
    variant === 'accent' ? Colors.text :
    Colors.white;
  const borderColor = variant === 'secondary' ? Colors.primary : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  text: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16 },
});
