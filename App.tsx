import React, {useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Alert, Modal, Platform, Pressable, Share, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold} from '@expo-google-fonts/nunito';
import {useIAP} from 'expo-iap';
import {Ionicons} from '@expo/vector-icons';
import Constants from 'expo-constants';
import {deviceLocale, hobbyName, tr} from './src/i18n';
import {deletePhotos, load, save} from './src/storage';
import {Hobby, Project, State} from './src/types';
import {s} from './src/styles';
import {useColors} from './src/theme';
import {exportProjectBackup, exportProjectPdf} from './src/export';
import {calc} from './src/math';
import {HobbyWorthBanner, prepareMobileAds, showPrivacyChoices} from './src/ads';
import {Home, Quiz, Pick, First, Calculator, History, Compare, Settings, blank, money, Screen} from './src/screens';

const CURRENT_PRODUCT = 'com.everittventures.hobbyworth.lifetime';
const LEGACY_ANDROID_PRODUCT = 'hobbyworth_lifetime';
const PRODUCT = Platform.OS === 'android' ? Constants.expoConfig?.extra?.androidIapProductId || CURRENT_PRODUCT : Constants.expoConfig?.extra?.iosIapProductId || CURRENT_PRODUCT;
const acceptedProducts = new Set([CURRENT_PRODUCT, LEGACY_ANDROID_PRODUCT, PRODUCT].filter(Boolean));
const PURCHASE_VERIFY_URL = Constants.expoConfig?.extra?.purchaseVerifyUrl || 'https://app.everittventures.com/api/mobile/google/verify';

function androidPurchaseToken(purchase: any): string | null {
  return purchase?.purchaseToken || purchase?.token || purchase?.purchaseTokenAndroid || null;
}

async function verifyAndroidPurchase(purchase: any): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const purchaseToken = androidPurchaseToken(purchase);
  if (!purchaseToken) return false;
  const response = await fetch(PURCHASE_VERIFY_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      productId: purchase.productId,
      purchaseToken,
      packageName: 'com.everittventures.hobbyworth'
    })
  });
  return response.ok;
}
const initial = (): State => ({project: null, history: [], premium: false, locale: deviceLocale(), symbol: ''});

function Main() {
  const [fonts] = useFonts({Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold});
  const [st, setSt] = useState<State>(initial());
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState<Screen[]>(['home']);
  const [payOpen, setPayOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [adsReady, setAdsReady] = useState(false);
  const colors = useColors();
  const iapRef = useRef<any>(null);
  const screen = stack[stack.length - 1];
  const l = st.locale;
  const go = (next: Screen) => setStack((current) => current[current.length - 1] === next ? current : [...current, next]);
  const goRoot = (next: Screen) => setStack(next === 'home' ? ['home'] : ['home', next]);
  const goHistory = () => st.premium ? goRoot('history') : setPayOpen(true);
  const back = () => setStack((current) => current.length > 1 ? current.slice(0, -1) : ['home']);
  const iap = useIAP({
    onPurchaseSuccess: async (purchase) => {
      if (!acceptedProducts.has(purchase.productId)) return;
      const verified = await verifyAndroidPurchase(purchase).catch(() => false);
      if (!verified) {
        Alert.alert(tr(st.locale, 'ui.purchaseError'));
        return;
      }
      try { await iapRef.current.finishTransaction({purchase, isConsumable: false}); } catch {}
      setSt((current) => ({...current, premium: true}));
      setPurchasing(false);
      setPayOpen(false);
      AccessibilityInfo.announceForAccessibility(tr(st.locale, 'ui.restored'));
    },
    onPurchaseError: () => { setPurchasing(false); Alert.alert(tr(st.locale, 'ui.purchaseError')); }
  });
  iapRef.current = iap;

  useEffect(() => { load(initial()).then((value) => { setSt(value); setReady(true); }); }, []);
  useEffect(() => { if (ready) save(st); }, [st, ready]);
  useEffect(() => {
    let active = true;
    if (!ready || st.premium) {
      setAdsReady(false);
      return () => { active = false; };
    }
    prepareMobileAds()
      .then((allowed) => { if (active) setAdsReady(allowed); })
      .catch((error) => {
        if (__DEV__) console.warn('Ads initialization failed:', error);
        if (active) setAdsReady(false);
      });
    return () => { active = false; };
  }, [ready, st.premium]);
  useEffect(() => {
    if (!iap.connected) return;
    const skus = Platform.OS === 'android' ? [PRODUCT, LEGACY_ANDROID_PRODUCT] : [PRODUCT];
    iap.fetchProducts({skus, type: 'in-app'});
    iap.getAvailablePurchases();
  }, [iap.connected]);
  useEffect(() => {
    const sync = async () => {
      const purchases = iap.availablePurchases.filter((purchase: any) => acceptedProducts.has(purchase.productId));
      if (!purchases.length) return;
      if (Platform.OS !== 'android') {
        setSt((current) => ({...current, premium: true}));
        return;
      }
      for (const purchase of purchases) {
        if (await verifyAndroidPurchase(purchase).catch(() => false)) {
          setSt((current) => ({...current, premium: true}));
          return;
        }
      }
    };
    sync();
  }, [iap.availablePurchases]);

  if (!fonts || !ready) return <View style={s.root} />;

  const choose = (hobby: Hobby) => {
    if (st.project && !st.premium) {
      return Alert.alert(tr(l, 'ui.freeUsed'), tr(l, 'ui.freeUsedBody'), [
        {text: tr(l, 'ui.cancel'), style: 'cancel'},
        {text: tr(l, 'ui.replace'), style: 'destructive', onPress: async () => {
          await deletePhotos(st.project!);
          setSt((current) => ({...current, project: blank(hobby.id)}));
          setStack(['home', 'first']);
        }},
        {text: tr(l, 'ui.keepUnlock'), onPress: () => setPayOpen(true)}
      ]);
    }
    setSt((current) => ({...current, project: blank(hobby.id)}));
    setStack(['home', 'first']);
  };

  const setProject = (project: Project) => setSt((current) => ({...current, project}));
  const finish = () => {
    if (!st.project) return;
    setCompletionOpen(true);
  };
  const finalizeFinish = () => {
    if (!st.project) return;
    const finished = {...st.project, completedAt: new Date().toISOString()};
    setCompletionOpen(false);
    if (st.premium) {
      setSt((current) => ({...current, project: null, history: [finished, ...current.history]}));
      setStack(['home', 'history']);
    } else {
      setSt((current) => ({...current, project: finished}));
      setStack(['home']);
    }
  };
  const shareResult = async () => {
    if (!st.project) return;
    const result = calc(st.project.numbers, st.premium ? st.project.split : undefined);
    await Share.share({
      message: `${hobbyName(st.project.hobbyId, l)} · ${tr(l, 'ui.left')}: ${money(result.leftover, st.symbol)} · ${tr(l, 'ui.hour')}: ${money(result.perHour, st.symbol)} · HobbyWorth`
    });
  };
  const repeat = (project: Project) => {
    setSt((current) => ({...current, project: {...project, id: `${Date.now()}`, createdAt: new Date().toISOString(), completedAt: undefined, steps: [], photos: [], coverPhotoIndex: 0}}));
    setStack(['home', 'first']);
  };
  const restore = async () => {
    try {
      await iap.restorePurchases?.();
      await iap.getAvailablePurchases?.();
      setTimeout(() => {
        const found = (iapRef.current?.availablePurchases || []).some((purchase: any) => acceptedProducts.has(purchase.productId));
        if (found) {
          setSt((current) => ({...current, premium: true}));
          Alert.alert(tr(l, 'ui.restored'));
        } else Alert.alert(tr(l, 'ui.notFound'));
      }, 250);
    } catch { Alert.alert(tr(l, 'ui.notFound')); }
  };
  const managePrivacy = async () => {
    try {
      const shown = await showPrivacyChoices();
      if (!shown) Alert.alert(tr(l, 'ui.privacyChoicesUnavailable'));
    } catch {
      Alert.alert(tr(l, 'ui.privacyChoicesError'));
    }
  };
  const product = (iap.products as any[]).find((item) => item.id === PRODUCT || item.productId === PRODUCT);
  const buy = async () => {
    if (!iap.connected) {
      Alert.alert(tr(l, 'ui.purchaseError'));
      return;
    }
    const loaded = (iap.products as any[]).some((item) => item.id === PRODUCT || item.productId === PRODUCT);
    if (!loaded) {
      try {
        await iap.fetchProducts({skus: [PRODUCT], type: 'in-app'});
      } catch {
        Alert.alert(tr(l, 'ui.purchaseError'));
        return;
      }
    }
    try {
      setPurchasing(true);
      await iap.requestPurchase({request: {apple: {sku: PRODUCT}, google: {skus: [PRODUCT]}}, type: 'in-app'});
    } catch {
      setPurchasing(false);
      Alert.alert(tr(l, 'ui.purchaseError'));
    }
  };

  return (
    <SafeAreaView style={[s.root, {backgroundColor: colors.surface}]}>
      <StatusBar style={colors === undefined ? 'auto' : 'auto'} />
      <View style={s.header}><View style={s.headerInner}>
        <Text accessibilityRole="header" style={s.wordmark}>HobbyWorth</Text>
        <Pressable
          accessibilityLabel={st.premium ? tr(l, 'ui.settings') : tr(l, 'ui.buy')}
          accessibilityRole="button"
          onPress={() => st.premium ? goRoot('settings') : setPayOpen(true)}
          style={({pressed}) => [s.settingsBtn, pressed && s.outlinePressed]}
        ><Text style={s.settingsBtnText}>{st.premium ? tr(l, 'ui.settings') : tr(l, 'ui.unlockShort')}</Text></Pressable>
      </View></View>
      <View style={s.content}>
        {screen === 'home' && <Home st={st} setProject={setProject} go={go} pay={() => setPayOpen(true)} />}
        {screen === 'quiz' && <Quiz st={st} choose={choose} />}
        {screen === 'pick' && <Pick st={st} choose={choose} />}
        {screen === 'first' && st.project && <First st={st} setProject={setProject} go={go} />}
        {screen === 'calc' && st.project && <Calculator st={st} setProject={setProject} finish={finish} pay={() => setPayOpen(true)} />}
        {screen === 'history' && <History st={st} repeat={repeat} exportPdf={(project) => exportProjectPdf(project, l, st.symbol)} exportBackup={(project) => exportProjectBackup(project, l)} />}
        {screen === 'compare' && <Compare st={st} />}
        {screen === 'settings' && <Settings st={st} setSt={setSt} restore={restore} pay={() => setPayOpen(true)} managePrivacy={managePrivacy} />}
      </View>
      {screen !== 'home' && !['pick','history','settings'].includes(screen) ? <View style={s.back}><Pressable accessibilityRole="button" onPress={back} style={s.linkHit}><Text style={s.link}>‹ {tr(l, 'ui.back')}</Text></Pressable></View> : null}
      {!st.premium ? <HobbyWorthBanner enabled={adsReady} /> : null}
      <View accessibilityRole="tablist" style={s.bottomNav}>
        <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'home'}} onPress={() => goRoot('home')} style={[s.bottomTab, screen === 'home' && s.bottomTabOn]}>
          <Ionicons name={screen === 'home' ? 'home' : 'home-outline'} size={21} color={screen === 'home' ? colors.accent : colors.textMuted} />
          <Text style={[s.bottomTabText, screen === 'home' && s.bottomTabTextOn]}>{tr(l, 'ui.navToday')}</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'pick'}} onPress={() => goRoot('pick')} style={[s.bottomTab, screen === 'pick' && s.bottomTabOn]}>
          <Ionicons name={screen === 'pick' ? 'compass' : 'compass-outline'} size={22} color={screen === 'pick' ? colors.accent : colors.textMuted} />
          <Text style={[s.bottomTabText, screen === 'pick' && s.bottomTabTextOn]}>{tr(l, 'ui.navStart')}</Text>
        </Pressable>
        {st.premium ? <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'history'}} onPress={goHistory} style={[s.bottomTab, screen === 'history' && s.bottomTabOn]}>
          <Ionicons name={screen === 'history' ? 'time' : 'time-outline'} size={22} color={screen === 'history' ? colors.accent : colors.textMuted} />
          <Text style={[s.bottomTabText, screen === 'history' && s.bottomTabTextOn]}>{tr(l, 'ui.navProjects')}</Text>
        </Pressable> : null}
        <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'settings'}} onPress={() => goRoot('settings')} style={[s.bottomTab, screen === 'settings' && s.bottomTabOn]}>
          <Ionicons name={screen === 'settings' ? 'settings' : 'settings-outline'} size={21} color={screen === 'settings' ? colors.accent : colors.textMuted} />
          <Text style={[s.bottomTabText, screen === 'settings' && s.bottomTabTextOn]}>{tr(l, 'ui.navSettings')}</Text>
        </Pressable>
      </View>
      <Modal visible={completionOpen} transparent animationType="fade" onRequestClose={() => setCompletionOpen(false)}>
        <View style={s.shade}>
          <View style={s.completionSheet}>
            {st.project ? (() => {
              const result = calc(st.project.numbers, st.premium ? st.project.split : undefined);
              return <>
                <Text style={s.kicker}>{tr(l, 'ui.projectSummary')}</Text>
                <Text accessibilityRole="header" style={s.h1}>{hobbyName(st.project.hobbyId, l)}</Text>
                <View style={[s.completionCard, result.leftover <= 0 && s.completionLoss, s.cardShadow]}>
                  {st.project.photos?.length ? <Image source={{uri: st.project.photos[Math.min(st.project.coverPhotoIndex || 0, st.project.photos.length - 1)]}} style={s.visual} resizeMode="cover" /> : null}
                  <Text style={s.small}>{tr(l, 'ui.left')}</Text>
                  <Text style={[s.completionValue, result.leftover <= 0 && s.completionValueLoss]}>{money(result.leftover, st.symbol)}</Text>
                  <Text style={s.body}>{result.leftover > 0 ? tr(l, 'ui.verdictProfit', {left: money(result.leftover, st.symbol), hour: money(result.perHour, st.symbol)}) : result.leftover === 0 ? tr(l, 'ui.verdictEven') : tr(l, 'ui.verdictLoss', {left: money(Math.abs(result.leftover), st.symbol)})}</Text>
                  <View style={s.completionMetrics}>
                    <View style={s.completionMetric}><Text style={s.small}>{tr(l, 'ui.hour')}</Text><Text style={s.metricValue}>{money(result.perHour, st.symbol)}</Text></View>
                    <View style={s.completionMetric}><Text style={s.small}>{tr(l, 'ui.breakEven')}</Text><Text style={s.metricValue}>{result.breakEven}</Text></View>
                  </View>
                  <Text style={s.completionBrand}>HobbyWorth</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={shareResult} style={({pressed}) => [s.btn, pressed && s.btnPressed]}><Text style={s.btnText}>{tr(l, 'ui.shareResult')}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={finalizeFinish} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.done')}</Text></Pressable>
              </>;
            })() : null}
          </View>
        </View>
      </Modal>
      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={() => setPayOpen(false)}><View style={s.shade}><View style={s.pay}>
        <Text accessibilityRole="header" style={s.h1}>{tr(l, 'ui.lifetime')}</Text>
        <Text style={s.body}>{tr(l, 'ui.lifetimeBody')}</Text>
        <View style={s.payPreview}>
          <View style={s.payPreviewCard}><View style={s.payPreviewMark} /><Text style={s.payPreviewText}>{tr(l, 'ui.history')}</Text></View>
          <View style={s.payPreviewCard}><View style={s.payPreviewMark} /><Text style={s.payPreviewText}>{tr(l, 'ui.compare')}</Text></View>
          <View style={s.payPreviewCard}><View style={s.payPreviewMark} /><Text style={s.payPreviewText}>{tr(l, 'ui.scenarios')}</Text></View>
        </View>
        <View style={s.payTrust}>
          <Text style={s.small}>{tr(l, 'ui.oneTime')}</Text>
          <Text style={s.small}>{tr(l, 'ui.noAccount')}</Text>
        </View>
        <View style={s.payBenefits}>
          <Text style={s.body}>✓ {tr(l, 'ui.unlockProjects')}</Text>
          <Text style={s.body}>✓ {tr(l, 'ui.unlockCompare')}</Text>
          <Text style={s.body}>✓ {tr(l, 'ui.unlockScenarios')}</Text>
          <Text style={s.body}>✓ {tr(l, 'ui.unlockExport')}</Text>
          <Text style={s.body}>✓ {tr(l, 'ui.unlockNoAds')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={buy} disabled={purchasing} accessibilityState={{disabled: purchasing, busy: purchasing}} style={({pressed}) => [s.btn, purchasing && {opacity: 0.6}, pressed && !purchasing && s.btnPressed]}><Text style={s.btnText}>{purchasing ? tr(l, 'ui.purchasing') : `${tr(l, 'ui.buy')}${product?.displayPrice ? ` · ${product.displayPrice}` : ''}`}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={restore} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.restore')}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPayOpen(false)} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.cancel')}</Text></Pressable>
      </View></View></Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}
