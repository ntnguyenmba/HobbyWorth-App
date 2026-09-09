import {ImageSourcePropType} from 'react-native';

const images:Record<string,ImageSourcePropType>={
  'logo.PNG':require('../assets/generated/logo.PNG'),
  'hero.PNG':require('../assets/generated/hero.PNG'),
  'baking.PNG':require('../assets/generated/baking.PNG'),
  'cooking.PNG':require('../assets/generated/cooking.PNG'),
  'drinks.PNG':require('../assets/generated/drinks.PNG'),
  'painting.PNG':require('../assets/generated/painting.PNG'),
  'knitting.PNG':require('../assets/generated/knitting.PNG'),
  'sewing.PNG':require('../assets/generated/sewing.PNG'),
  'planting.PNG':require('../assets/generated/planting.PNG'),
  'handyman.PNG':require('../assets/generated/handyman.PNG'),
  'photography.PNG':require('../assets/generated/photography.PNG'),
  'coding.PNG':require('../assets/generated/coding.PNG')
};

export function art(file:string):ImageSourcePropType{return images[file]||images['hero.PNG']}
