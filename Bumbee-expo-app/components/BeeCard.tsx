import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  children: ReactNode;
  style?: any;
  variant?: 'default' | 'elevated' | 'outline' | 'flat';
}

export function BeeCard({ children, style, variant = 'default' }: Props) {
  return (
    <View style={[styles.base, variant === 'elevated' && styles.elevated, variant === 'outline' && styles.outline, variant === 'flat' && styles.flat, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  elevated: {
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderColor: Colors.border,
  },
  outline: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    backgroundColor: Colors.backgroundAlt,
  },
});
