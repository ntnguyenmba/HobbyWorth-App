import {useColorScheme, useWindowDimensions} from 'react-native';

export const lightColors = {
  action: '#E84A3C',
  actionPressed: '#D03D30',
  surface: '#FFFDF7',
  surfaceStrong: '#FFFFFF',
  surfaceSoft: '#F0F7F9',
  surfaceWarm: '#FFF4F0',
  text: '#1C2B30',
  textMuted: '#5A6B72',
  accent: '#0F5C6B',
  accentLine: '#2A9BB0',
  accentSoft: '#B8E4EF',
  line: '#E2DCD3',
  focus: '#0F5C6B',
  danger: '#B83A32',
  profit: '#0F7A4A',
  profitSoft: '#E6F5EE'
};

export const darkColors = {
  action: '#FF7468',
  actionPressed: '#FF8C83',
  surface: '#152126',
  surfaceStrong: '#1B2A30',
  surfaceSoft: '#1E343C',
  surfaceWarm: '#342622',
  text: '#F7F4EC',
  textMuted: '#C9D1D4',
  accent: '#9ED9E8',
  accentLine: '#69B8CB',
  accentSoft: '#2B5963',
  line: '#405158',
  focus: '#B7E8F2',
  danger: '#FF9B92',
  profit: '#7DD9A7',
  profitSoft: '#18392B'
};

export const C = {
  coral: lightColors.action,
  coralPressed: lightColors.actionPressed,
  cream: lightColors.surface,
  white: lightColors.surfaceStrong,
  pale: lightColors.surfaceSoft,
  pink: lightColors.surfaceWarm,
  ink: lightColors.text,
  muted: lightColors.textMuted,
  tealInk: lightColors.accent,
  teal: lightColors.accentLine,
  sky: lightColors.accentSoft,
  line: lightColors.line,
  profit: lightColors.profit,
  profitSoft: lightColors.profitSoft
};

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useType() {
  const {width} = useWindowDimensions();
  const tablet = width >= 700;
  const large = width >= 1024;
  return {
    tablet,
    large,
    hero: tablet ? (large ? 48 : 44) : 36,
    h1: tablet ? 32 : 28,
    h2: tablet ? 24 : 22,
    h3: tablet ? 19 : 18,
    body: 16,
    button: 17,
    small: 13,
    kicker: 12,
    pagePad: tablet ? 28 : 18,
    max: tablet ? 720 : 560,
    gap: tablet ? 20 : 16
  };
}
