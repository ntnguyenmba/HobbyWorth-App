import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const fullSource = fs.readFileSync(new URL('../src/ads.tsx', import.meta.url), 'utf8');
const logic = fullSource.slice(0, fullSource.indexOf('export function HobbyWorthBanner'))
  .replace(/^import[\s\S]*?from '[^']+';\s*/gm, '')
  .replace(/export /g, '');
const source = ts.transpileModule(logic, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText + '\n;({prepareMobileAds,refreshAdPermission,showPrivacyChoices})';

function harness(options = {}) {
  const state = {allowed: false, gdpr: true, purposes: '0', gatherError: false, infoError: false,
    required: true, afterForm: undefined, initializeError: false, gdprError: false, ...options};
  const calls = {gather: 0, initialize: 0, att: 0, form: 0};
  const context = {
    Platform: {OS: options.platform || 'ios'}, __DEV__: false, console,
    Constants: {expoConfig: {extra: {androidAdMobBannerUnitId: 'android', iosAdMobBannerUnitId: 'ios'}}},
    AdsConsentPrivacyOptionsRequirementStatus: {REQUIRED: 'required'},
    PermissionStatus: {UNDETERMINED: 'undetermined'},
    getTrackingPermissionsAsync: async () => ({status: 'undetermined'}),
    requestTrackingPermissionsAsync: async () => {calls.att++; return {status: 'denied'};},
    mobileAds: () => ({initialize: async () => {
      calls.initialize++;
      if (state.initializeError) throw Error('sdk');
      if (state.revokeDuringInitialization) state.allowed = false;
    }}),
    AdsConsent: {
      gatherConsent: async () => {calls.gather++; if(state.gatherError) throw Error('offline');},
      getConsentInfo: async () => {if(state.infoError) throw Error('offline'); return {canRequestAds: state.allowed};},
      getGdprApplies: async () => {if(state.gdprError) throw Error('unknown'); return state.gdpr;},
      getPurposeConsents: async () => state.purposes,
      requestInfoUpdate: async () => ({privacyOptionsRequirementStatus: state.required ? 'required' : 'not-required'}),
      showPrivacyOptionsForm: async () => {calls.form++; if (state.afterForm !== undefined) state.allowed = state.afterForm;}
    }
  };
  return {api: vm.runInNewContext(source, context), state, calls};
}
let tests = 0;
async function check(name, test) {await test(); tests++; console.log('PASS ' + name);}
await check('new user with no consent makes no SDK or ATT requests', async () => {
  const h=harness(); assert.equal(await h.api.prepareMobileAds(), false);
  assert.equal(h.calls.initialize,0); assert.equal(h.calls.att,0);
});
await check('consent update failure without previous permission blocks ads', async () => {
  const h=harness({gatherError:true}); assert.equal(await h.api.prepareMobileAds(), false); assert.equal(h.calls.initialize,0);
});
await check('consent update failure honors UMP previous valid permission', async () => {
  const h=harness({gatherError:true,allowed:true}); assert.equal(await h.api.prepareMobileAds(), true); assert.equal(h.calls.initialize,1);
});
await check('denied ATT still allows UMP-approved non-personalized ads', async () => {
  const h=harness({allowed:true,gdpr:false}); assert.equal(await h.api.prepareMobileAds(),true);
  assert.equal(h.calls.att,1); assert.equal(h.calls.initialize,1);
  assert.match(fullSource,/requestNonPersonalizedAdsOnly: true/);
});
await check('concurrent startup calls initialize SDK once', async () => {
  const h=harness({allowed:true}); const r=await Promise.all([h.api.prepareMobileAds(),h.api.prepareMobileAds()]);
  assert.deepEqual(r,[true,true]); assert.equal(h.calls.gather,1); assert.equal(h.calls.initialize,1);
});
await check('privacy revocation returns false instead of cached permission', async () => {
  const h=harness({allowed:true,afterForm:false}); await h.api.prepareMobileAds();
  const result=await h.api.showPrivacyChoices(); assert.equal(result.shown,true); assert.equal(result.canRequestAds,false);
  assert.equal(h.calls.initialize,1);
});
await check('initial denial can recover after privacy consent is granted', async () => {
  const h=harness({afterForm:true}); assert.equal(await h.api.prepareMobileAds(),false);
  const result=await h.api.showPrivacyChoices(); assert.equal(result.canRequestAds,true); assert.equal(h.calls.initialize,1);
});
await check('failed initialization can be retried', async () => {
  const h=harness({allowed:true,initializeError:true}); await assert.rejects(h.api.prepareMobileAds());
  h.state.initializeError=false; assert.equal(await h.api.prepareMobileAds(),true); assert.equal(h.calls.initialize,2);
});
await check('unknown GDPR applicability does not request tracking', async () => {
  const h=harness({allowed:true,gdprError:true}); assert.equal(await h.api.prepareMobileAds(),true); assert.equal(h.calls.att,0);
});
await check('consent revoked during SDK startup is checked again', async () => {
  const h=harness({allowed:true,revokeDuringInitialization:true}); assert.equal(await h.api.prepareMobileAds(),false);
});
await check('web does not invoke native advertising APIs', async () => {
  const h=harness({platform:'web',allowed:true}); assert.equal(await h.api.prepareMobileAds(),false); assert.equal(h.calls.gather,0);
});
await check('privacy entry point not required still refreshes ad permission', async () => {
  const h=harness({required:false}); const result=await h.api.showPrivacyChoices();
  assert.equal(result.shown,false); assert.equal(result.canRequestAds,false); assert.equal(h.calls.form,0);
});
console.log(tests+' consent behavior tests passed');
