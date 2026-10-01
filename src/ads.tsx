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
let sdkInitialization: Promise<void> | null = null;

function getBannerUnitId() {
  if (__DEV__) return TestIds.ADAPTIVE_BANNER;
  return Platform.OS === 'ios' ? iosBannerId : androidBannerId;
}

async function requestAttWhenAllowed() {
  if (Platform.OS !== 'ios') return;

  const gdprApplies = await AdsConsent.getGdprApplies().catch(() => true);
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
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  try {
    await AdsConsent.gatherConsent();
  } catch (error) {
    if (__DEV__) console.warn('Ad consent gathering failed:', error);
  }

  return refreshAdPermission();
}

export async function refreshAdPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  const consentInfo = await AdsConsent.getConsentInfo().catch(() => null);
  if (!consentInfo?.canRequestAds) return false;

  await requestAttWhenAllowed().catch((error) => {
    if (__DEV__) console.warn('ATT request failed:', error);
  });

  if (!sdkInitialization) {
    sdkInitialization = mobileAds().initialize().then(() => undefined).catch((error) => {
      sdkInitialization = null;
      throw error;
    });
  }
  await sdkInitialization;
  const latestConsent = await AdsConsent.getConsentInfo().catch(() => null);
  return latestConsent?.canRequestAds === true;
}

export function prepareMobileAds(): Promise<boolean> {
  if (!initialization) {
    initialization = initializeMobileAdsOnce().finally(() => { initialization = null; });
  }
  return initialization;
}

export async function showPrivacyChoices(): Promise<{shown: boolean; canRequestAds: boolean}> {
  const info = await AdsConsent.requestInfoUpdate();
  if (
    info.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
  ) {
    await AdsConsent.showPrivacyOptionsForm();
    return {shown: true, canRequestAds: await refreshAdPermission()};
  }
  return {shown: false, canRequestAds: await refreshAdPermission()};
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
        requestOptions={{requestNonPersonalizedAdsOnly: true}}
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
