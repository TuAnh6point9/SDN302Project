import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  largeTitle: {
    fontFamily: 'System',
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.4,
  },
  h1: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.36,
  },
  h2: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.35,
  },
  h3: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.38,
  },
  body: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: -0.08,
  },
});
