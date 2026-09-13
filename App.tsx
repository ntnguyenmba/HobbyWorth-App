import React, {useEffect, useRef, useState} from 'react';
import {Alert, Image, Modal, Pressable, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold} from '@expo-google-fonts/nunito';
import {useIAP} from 'expo-iap';
import Constants from 'expo-constants';
import {art} from './src/assets';
import {deviceLocale, hobbyName, tr} from './src/i18n';
import {calc} from './src/math';
import {deletePhotos, load, save} from './src/storage';
import {Hobby, Project, State} from './src/types';
import {C} from './src/theme';
import {s} from './src/styles';
import {Home, Quiz, Pick, First, Calculator, History, Compare, Settings, blank, money, Screen} from './src/screens';

const PRODUCT =
  Constants.expoConfig?.extra?.iosIapProductId ||
  Constants.expoConfig?.extra?.androidIapProductId ||
  'com.everittventures.hobbyworth.lifetime';

const initial = (): State => ({
  project: null,
  history: [],
  premium: false,
  locale: deviceLocale(),
  symbol: ''
});

function Main() {
  const [fonts] = useFonts({Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold});
  const [st, setSt] = useState<State>(initial());
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState<Screen[]>(['home']);
  const [payOpen, setPayOpen] = useState(false);
  const ref = useRef<any>(null);
  const screen = stack[stack.length - 1];
  const l = st.locale;
  const go = (x: Screen) => setStack((cur) => (cur[cur.length - 1] === x ? cur : [...cur, x]));
  const back = () => setStack((cur) => (cur.length > 1 ? cur.slice(0, -1) : ['home']));
  const iap = useIAP({
    onPurchaseSuccess: async (p) => {
      if (p.productId === PRODUCT || p.productId === 'hobbyworth_lifetime') {
        try { await ref.current.finishTransaction({purchase: p, isConsumable: false}); } catch {}
        setSt((x) => ({...x, premium: true}));
        setPayOpen(false);
      }
    },
    onPurchaseError: () => Alert.alert(tr(st.locale, 'ui.purchaseError'))
  });
  ref.current = iap;
  useEffect(() => { load(initial()).then((x) => { setSt(x); setReady(true); }); }, []);
  useEffect(() => { if (ready) save(st); }, [st, ready]);
  useEffect(() => {
    if (iap.connected) {
      iap.fetchProducts({skus: [PRODUCT, 'hobbyworth_lifetime'], type: 'in-app'});
      iap.getAvailablePurchases();
    }
  }, [iap.connected]);
  useEffect(() => {
    if (iap.availablePurchases.some((p: any) => p.productId === PRODUCT || p.productId === 'hobbyworth_lifetime')) {
      setSt((x) => ({...x, premium: true}));
    }
  }, [iap.availablePurchases]);
  if (!fonts || !ready) return <View style={{flex: 1, backgroundColor: C.cream}} />;
  const choose = (h: Hobby) => {
    if (st.project && !st.premium) {
      return Alert.alert(tr(l, 'ui.freeUsed'), tr(l, 'ui.freeUsedBody'), [
        {text: tr(l, 'ui.cancel')},
        {text: tr(l, 'ui.replace'), style: 'destructive', onPress: async () => {
          await deletePhotos(st.project!);
          setSt((x) => ({...x, project: blank(h.id)}));
          setStack(['home', 'first']);
        }},
        {text: tr(l, 'ui.keepUnlock'), onPress: () => setPayOpen(true)}
      ]);
    }
    setSt((x) => ({...x, project: blank(h.id)}));
    setStack(['home', 'first']);
  };
  const setProject = (p: Project) => setSt((x) => ({...x, project: p}));
  const finish = () => {
    if (!st.project) return;
    if (st.premium) {
      const p = {...st.project, completedAt: new Date().toISOString()};
      setSt((x) => ({...x, project: null, history: [p, ...x.history]}));
      setStack(['home', 'history']);
      return;
    }
    setSt((x) => ({...x, project: x.project ? {...x.project, completedAt: new Date().toISOString()} : x.project}));
    setStack(['home']);
  };
  const repeat = (p: Project) => {
    setSt((x) => ({...x, project: {...p, id: `${Date.now()}`, createdAt: new Date().toISOString(), completedAt: undefined, steps: [], photos: []}}));
    setStack(['home', 'first']);
  };
  const exportBackup = async (p: Project) => {
    const file = `${FS.cacheDirectory}hobbyworth-${p.id}.json`;
    await FS.writeAsStringAsync(file, JSON.stringify({schemaVersion: 1, project: p}, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file, {mimeType: 'application/json', dialogTitle: tr(l, 'ui.exportJson')});
  };
  const exportPdf = async (p: Project) => {
    const m = calc(p.numbers, p.split);
    const pdf = await Print.printToFileAsync({html: `<h1 style="color:#243238">HobbyWorth</h1><h2>${hobbyName(p.hobbyId, l)}</h2><p>${tr(l, 'ui.cost')}: ${money(m.cost, st.symbol)}</p><p>${tr(l, 'ui.hour')}: ${money(m.perHour, st.symbol)}</p>`});
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(pdf.uri, {mimeType: 'application/pdf', dialogTitle: tr(l, 'ui.exportPdf')});
  };
  const restore = async () => {
    try {
      await iap.restorePurchases?.();
      await iap.getAvailablePurchases?.();
      setTimeout(() => {
        const found = (ref.current?.availablePurchases || []).some((p: any) => p.productId === PRODUCT || p.productId === 'hobbyworth_lifetime');
        if (found) { setSt((x) => ({...x, premium: true})); Alert.alert(tr(l, 'ui.restored')); }
        else Alert.alert(tr(l, 'ui.notFound'));
      }, 250);
    } catch { Alert.alert(tr(l, 'ui.notFound')); }
  };
  const product = (iap.products as any[]).find((p) => p.id === PRODUCT || p.id === 'hobbyworth_lifetime');
  const buy = () => iap.requestPurchase({request: {apple: {sku: PRODUCT}, google: {skus: [PRODUCT, 'hobbyworth_lifetime']}}, type: 'in-app'});
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <View style={s.headerInner}>
          <Image source={art('logo.PNG')} resizeMode="contain" style={s.logo} accessibilityLabel="HobbyWorth" />
          <Pressable onPress={() => go('settings')} style={s.settingsBtn} accessibilityLabel={tr(l, 'ui.settings')}>
            <Text style={s.settingsBtnText}>{tr(l, 'ui.settings')}</Text>
          </Pressable>
        </View>
      </View>
      {screen === 'home' && <Home st={st} setProject={setProject} go={go} />}
      {screen === 'quiz' && <Quiz st={st} choose={choose} />}
      {screen === 'pick' && <Pick st={st} choose={choose} />}
      {screen === 'first' && st.project && <First st={st} setProject={setProject} go={go} />}
      {screen === 'calc' && st.project && <Calculator st={st} setProject={setProject} finish={finish} pay={() => setPayOpen(true)} />}
      {screen === 'history' && <History st={st} repeat={repeat} exportPdf={exportPdf} exportBackup={exportBackup} />}
      {screen === 'compare' && <Compare st={st} />}
      {screen === 'settings' && <Settings st={st} setSt={setSt} restore={restore} pay={() => setPayOpen(true)} />}
      {screen !== 'home' ? <View style={s.back}><Pressable onPress={back}><Text style={s.link}>{tr(l, 'ui.back')}</Text></Pressable></View> : null}
      <Modal visible={payOpen} transparent animationType="slide">
        <View style={s.shade}>
          <View style={s.pay}>
            <Text style={s.h1}>{tr(l, 'ui.lifetime')}</Text>
            <Text style={s.body}>{tr(l, 'ui.lifetimeBody')}</Text>
            <Pressable onPress={buy} style={s.btn}><Text style={s.btnText}>{`${tr(l, 'ui.buy')}${product?.displayPrice ? ` · ${product.displayPrice}` : ''}`}</Text></Pressable>
            <Pressable onPress={restore}><Text style={s.link}>{tr(l, 'ui.restore')}</Text></Pressable>
            <Pressable onPress={() => setPayOpen(false)}><Text style={s.link}>{tr(l, 'ui.cancel')}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}
