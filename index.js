import React from 'react';
import {registerRootComponent} from 'expo';
import mobileAds from 'react-native-google-mobile-ads';
import App from './App';

mobileAds()
  .initialize()
  .catch((error) => {
    if (__DEV__) console.warn('AdMob initialization failed:', error);
  });

registerRootComponent(App);
