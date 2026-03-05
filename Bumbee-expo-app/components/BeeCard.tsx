import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function BeeCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
