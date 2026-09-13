import {useWindowDimensions} from 'react-native';

export const C = {
  coral: '#FF5548',
  teal: '#49A7BE',
  cream: '#FFFDF7',
  sky: '#83D5F1',
  ink: '#243238',
  muted: '#3E5158',
  pale: '#EDF9FC',
  pink: '#FFF0EC',
  line: '#D6CFC4',
  white: '#FFFFFF',
  coralPressed: '#E0483D',
  tealInk: '#1F5F70'
};

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
    small: 13,
    pagePad: tablet ? 28 : 18,
    max: tablet ? 720 : 560,
    gap: tablet ? 14 : 12
  };
}
