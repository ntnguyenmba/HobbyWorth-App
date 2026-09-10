import {ImageSourcePropType} from 'react-native';

const images:Record<string,ImageSourcePropType>={
  'logo.PNG':require('../assets/generated/logo.png'),
  'hero.PNG':require('../assets/generated/hero.png'),
  'baking.PNG':require('../assets/generated/baking.png'),
  'cooking.PNG':require('../assets/generated/cooking.png'),
  'drinks.PNG':require('../assets/generated/drinks.png'),
  'painting.PNG':require('../assets/generated/painting.png'),
  'knitting.PNG':require('../assets/generated/knitting.png'),
  'sewing.PNG':require('../assets/generated/sewing.png'),
  'planting.PNG':require('../assets/generated/planting.png'),
  'handyman.PNG':require('../assets/generated/handyman.png'),
  'photography.PNG':require('../assets/generated/photography.png'),
  'coding.PNG':require('../assets/generated/coding.png')
};

export function art(file:string):ImageSourcePropType{return images[file]||images['hero.PNG']}
