import React from 'react';
import {Platform,View} from 'react-native';
import Constants from 'expo-constants';
import {BannerAd,BannerAdSize,TestIds} from 'react-native-google-mobile-ads';

const ANDROID_BANNER_ID='ca-app-pub-8647405301136182/4451189318';

export function HobbyWorthBanner(){
  if(Platform.OS!=='android')return null;
  const unitId=__DEV__?TestIds.ADAPTIVE_BANNER:ANDROID_BANNER_ID;
  return <View style={{alignItems:'center',justifyContent:'center',minHeight:60,paddingTop:6,paddingBottom:6}}><BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}/></View>;
}

export const admobConfigured=Platform.OS==='android'&&Boolean(Constants.expoConfig?.extra?.androidAdMobBannerUnitId);
