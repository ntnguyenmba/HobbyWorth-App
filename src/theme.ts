import {useColorScheme, useWindowDimensions} from 'react-native';

export const lightColors = {
  action: '#FF5548',
  actionPressed: '#E0483D',
  surface: '#FFFDF7',
  surfaceStrong: '#FFFFFF',
  surfaceSoft: '#EDF9FC',
  surfaceWarm: '#FFF0EC',
  text: '#243238',
  textMuted: '#3E5158',
  accent: '#1F5F70',
  accentLine: '#49A7BE',
  accentSoft: '#83D5F1',
  line: '#D6CFC4',
  focus: '#1F5F70',
  danger: '#A43F38'
};

export const darkColors = {
  action: '#FF7B70',
  actionPressed: '#FF958D',
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
  danger: '#FF9B92'
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
  line: lightColors.line
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
    hero: tablet ? (large ? 56 : 44) : 34,
    h1: tablet ? 34 : 28,
    h2: tablet ? 26 : 22,
    h3: tablet ? 20 : 18,
    body: 17,
    button: 17,
    small: 14,
    pagePad: tablet ? 28 : 18,
    max: tablet ? 720 : 560,
    gap: tablet ? 16 : 14
  };
}
