import React from 'react';
import {Platform, View} from 'react-native';
import {registerRootComponent} from 'expo';
import mobileAds from 'react-native-google-mobile-ads';
import App from './App';
import {HobbyWorthBanner} from './src/ads';

if (Platform.OS === 'android') mobileAds().initialize().catch(() => {});

function HobbyWorthWithAds() {
  return <View style={{flex: 1}}><View style={{flex: 1}}><App /></View><HobbyWorthBanner /></View>;
}

registerRootComponent(HobbyWorthWithAds);
