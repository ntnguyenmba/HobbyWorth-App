import React from 'react';
import {Platform, View} from 'react-native';
import Constants from 'expo-constants';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  TestIds
} from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync
} from 'expo-tracking-transparency';

const androidBannerId = Constants.expoConfig?.extra?.androidAdMobBannerUnitId;
const iosBannerId = Constants.expoConfig?.extra?.iosAdMobBannerUnitId;

let initialization: Promise<boolean> | null = null;

function getBannerUnitId() {
  if (__DEV__) return TestIds.ADAPTIVE_BANNER;
  return Platform.OS === 'ios' ? iosBannerId : androidBannerId;
}

async function requestAttWhenAllowed() {
  if (Platform.OS !== 'ios') return;

  const gdprApplies = await AdsConsent.getGdprApplies().catch(() => false);
  const purposeConsents = gdprApplies
    ? await AdsConsent.getPurposeConsents().catch(() => '')
    : '';
  const mayRequestTracking = !gdprApplies || purposeConsents.startsWith('1');

  if (!mayRequestTracking) return;

  const current = await getTrackingPermissionsAsync();
  if (current.status === PermissionStatus.UNDETERMINED) {
    await requestTrackingPermissionsAsync();
  }
}

async function initializeMobileAdsOnce(): Promise<boolean> {
  try {
    await AdsConsent.gatherConsent();
  } catch (error) {
    if (__DEV__) console.warn('Ad consent gathering failed:', error);
  }

  const consentInfo = await AdsConsent.getConsentInfo().catch(() => null);
  if (!consentInfo?.canRequestAds) return false;

  await requestAttWhenAllowed().catch((error) => {
    if (__DEV__) console.warn('ATT request failed:', error);
  });

  await mobileAds().initialize();
  return true;
}

export function prepareMobileAds(): Promise<boolean> {
  if (!initialization) initialization = initializeMobileAdsOnce();
  return initialization;
}

export async function showPrivacyChoices(): Promise<boolean> {
  const info = await AdsConsent.requestInfoUpdate();
  if (
    info.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
  ) {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  }
  return false;
}

export function HobbyWorthBanner({enabled}: {enabled: boolean}) {
  const unitId = getBannerUnitId();

  if (
    !enabled ||
    (Platform.OS !== 'ios' && Platform.OS !== 'android') ||
    !unitId
  ) {
    return null;
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
        paddingTop: 6,
        paddingBottom: 6
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
