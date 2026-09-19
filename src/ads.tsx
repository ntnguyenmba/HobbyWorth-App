import React from 'react';
import {Platform, View} from 'react-native';
import Constants from 'expo-constants';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';

const androidBannerId = Constants.expoConfig?.extra?.androidAdMobBannerUnitId;
const iosBannerId = Constants.expoConfig?.extra?.iosAdMobBannerUnitId;

function getBannerUnitId() {
  if (__DEV__) return TestIds.ADAPTIVE_BANNER;
  return Platform.OS === 'ios' ? iosBannerId : androidBannerId;
}

export function HobbyWorthBanner() {
  const unitId = getBannerUnitId();

  if ((Platform.OS !== 'ios' && Platform.OS !== 'android') || !unitId) {
    return null;
  }

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          if (__DEV__) console.warn('AdMob banner failed to load:', error);
        }}
      />
    </View>
  );
}

export const admobConfigured =
  Platform.OS === 'ios'
    ? Boolean(iosBannerId)
    : Platform.OS === 'android'
      ? Boolean(androidBannerId)
      : false;
