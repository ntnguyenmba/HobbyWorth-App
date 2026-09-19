import React from 'react';
import {View} from 'react-native';
import {registerRootComponent} from 'expo';
import mobileAds from 'react-native-google-mobile-ads';
import App from './App';
import {HobbyWorthBanner} from './src/ads';

mobileAds()
  .initialize()
  .catch((error) => {
    if (__DEV__) console.warn('AdMob initialization failed:', error);
  });

function HobbyWorthWithAds() {
  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1}}>
        <App />
      </View>
      <HobbyWorthBanner />
    </View>
  );
}

registerRootComponent(HobbyWorthWithAds);
