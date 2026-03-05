import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  display: { fontFamily: 'Fredoka_600SemiBold', fontSize: 48, color: Colors.text },
  h1: { fontFamily: 'Fredoka_600SemiBold', fontSize: 32, color: Colors.text },
  h2: { fontFamily: 'Fredoka_600SemiBold', fontSize: 24, color: Colors.text },
  h3: { fontFamily: 'Fredoka_600SemiBold', fontSize: 18, color: Colors.text },
  body: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text },
  bodySemiBold: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text },
  caption: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.secondary },
  label: { fontFamily: 'Fredoka_600SemiBold', fontSize: 12, color: Colors.white },
  button: { fontFamily: 'Fredoka_600SemiBold', fontSize: 16, color: Colors.white },
});
