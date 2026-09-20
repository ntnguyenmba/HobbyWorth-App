import React, {useEffect, useRef, useState} from 'react';
import {Alert, Modal, Platform, Pressable, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold} from '@expo-google-fonts/nunito';
import {useIAP} from 'expo-iap';
import Constants from 'expo-constants';
import {deviceLocale, tr} from './src/i18n';
import {deletePhotos, load, save} from './src/storage';
import {Hobby, Project, State} from './src/types';
import {s} from './src/styles';
import {exportProjectBackup, exportProjectPdf} from './src/export';
import {Home, Quiz, Pick, First, Calculator, History, Compare, Settings, blank, Screen} from './src/screens';

const CURRENT_PRODUCT = 'com.everittventures.hobbyworth.lifetime';
const LEGACY_ANDROID_PRODUCT = 'hobbyworth_lifetime';
const PRODUCT = Platform.OS === 'android' ? Constants.expoConfig?.extra?.androidIapProductId || CURRENT_PRODUCT : Constants.expoConfig?.extra?.iosIapProductId || CURRENT_PRODUCT;
const acceptedProducts = new Set([CURRENT_PRODUCT, LEGACY_ANDROID_PRODUCT, PRODUCT].filter(Boolean));
const PURCHASE_VERIFY_URL = Constants.expoConfig?.extra?.purchaseVerifyUrl || 'https://hobbyworth.everittventures.com/api/mobile/google/verify';

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
  const iapRef = useRef<any>(null);
  const screen = stack[stack.length - 1];
  const l = st.locale;
  const go = (next: Screen) => setStack((current) => current[current.length - 1] === next ? current : [...current, next]);
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
      setPayOpen(false);
    },
    onPurchaseError: () => Alert.alert(tr(st.locale, 'ui.purchaseError'))
  });
  iapRef.current = iap;

  useEffect(() => { load(initial()).then((value) => { setSt(value); setReady(true); }); }, []);
  useEffect(() => { if (ready) save(st); }, [st, ready]);
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
    const finished = {...st.project, completedAt: new Date().toISOString()};
    if (st.premium) {
      setSt((current) => ({...current, project: null, history: [finished, ...current.history]}));
      setStack(['home', 'history']);
    } else {
      setSt((current) => ({...current, project: finished}));
      setStack(['home']);
    }
  };
  const repeat = (project: Project) => {
    setSt((current) => ({...current, project: {...project, id: `${Date.now()}`, createdAt: new Date().toISOString(), completedAt: undefined, steps: [], photos: []}}));
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
      await iap.requestPurchase({request: {apple: {sku: PRODUCT}, google: {skus: [PRODUCT]}}, type: 'in-app'});
    } catch {
      Alert.alert(tr(l, 'ui.purchaseError'));
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={s.header}><View style={s.headerInner}>
        <Text accessibilityRole="header" style={s.wordmark}>HobbyWorth</Text>
        <Pressable accessibilityLabel={tr(l, 'ui.settings')} accessibilityRole="button" onPress={() => go('settings')} style={({pressed}) => [s.settingsBtn, pressed && s.outlinePressed]}><Text style={s.settingsBtnText}>{tr(l, 'ui.settings')}</Text></Pressable>
      </View></View>
      {screen === 'home' && <Home st={st} setProject={setProject} go={go} />}
      {screen === 'quiz' && <Quiz st={st} choose={choose} />}
      {screen === 'pick' && <Pick st={st} choose={choose} />}
      {screen === 'first' && st.project && <First st={st} setProject={setProject} go={go} />}
      {screen === 'calc' && st.project && <Calculator st={st} setProject={setProject} finish={finish} pay={() => setPayOpen(true)} />}
      {screen === 'history' && <History st={st} repeat={repeat} exportPdf={(project) => exportProjectPdf(project, l, st.symbol)} exportBackup={(project) => exportProjectBackup(project, l)} />}
      {screen === 'compare' && <Compare st={st} />}
      {screen === 'settings' && <Settings st={st} setSt={setSt} restore={restore} pay={() => setPayOpen(true)} />}
      {screen !== 'home' ? <View style={s.back}><Pressable accessibilityRole="button" onPress={back} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.back')}</Text></Pressable></View> : null}
      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={() => setPayOpen(false)}><View style={s.shade}><View style={s.pay}>
        <Text accessibilityRole="header" style={s.h1}>{tr(l, 'ui.lifetime')}</Text>
        <Text style={s.body}>{tr(l, 'ui.lifetimeBody')}</Text>
        <Pressable accessibilityRole="button" onPress={buy} style={({pressed}) => [s.btn, pressed && s.btnPressed]}><Text style={s.btnText}>{`${tr(l, 'ui.buy')}${product?.displayPrice ? ` · ${product.displayPrice}` : ''}`}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={restore} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.restore')}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPayOpen(false)} style={s.linkHit}><Text style={s.link}>{tr(l, 'ui.cancel')}</Text></Pressable>
      </View></View></Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}
