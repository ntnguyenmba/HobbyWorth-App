import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const stripTypeScriptTypes = (source) => ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None}}).outputText;
const source = fs.readFileSync(new URL('../App.tsx', import.meta.url),'utf8');
const verify = source.slice(source.indexOf('function androidPurchaseToken'),source.indexOf('const initial'));
const restore = source.slice(source.indexOf('  const restore = async'),source.indexOf('  const managePrivacy'));
function harness(options = {}) {
  const calls = {premium: false, busy: [], alerts: [], finished: 0, verified: 0};
  const context = {Platform: {OS:options.os||'android'}, PURCHASE_VERIFY_URL:'https://verify.test', acceptedProducts:new Set(['lifetime']), purchasing:false, l:'en',
    iap: {connected:true,restorePurchases:async()=>{},finishTransaction:async()=>{calls.finished++;}},
    getAvailablePurchases:async()=>{if(options.queryError)throw Error('offline');return options.purchases||[];},
    fetch:async()=>{calls.verified++;if(options.fetchError)throw Error('offline');return {ok:options.ok!==false,json:async()=>({verified:options.verified===true})};},
    setPurchasing:value=>calls.busy.push(value),setSt:fn=>{calls.premium=fn({premium:false}).premium;}, Alert:{alert:value=>calls.alerts.push(value)}, tr:(l,k)=>k,
  };
  return {calls, restore:vm.runInNewContext(stripTypeScriptTypes(verify+restore)+'\nrestore;',context)};
}
let tests = 0;
async function check(label, options, premium, alert) {const h=harness(options);await h.restore();assert.equal(h.calls.premium,premium);assert.equal(h.calls.alerts.at(-1),alert);assert.deepEqual(h.calls.busy,[true,false]);if(!premium)assert.equal(h.calls.finished,0);tests++;console.log('PASS '+label);}
const purchase={productId:'lifetime',purchaseToken:'token'};
await check('verified Android purchase restores',{purchases:[purchase],verified:true},true,'ui.restored');
await check('HTTP success without verified true cannot unlock',{purchases:[purchase]},false,'ui.notFound');
await check('rejected Android purchase cannot unlock',{purchases:[purchase],ok:false},false,'ui.notFound');
await check('missing purchase token cannot unlock',{purchases:[{productId:'lifetime'}],verified:true},false,'ui.notFound');
await check('unrelated product cannot unlock',{purchases:[{productId:'other',purchaseToken:'token'}],verified:true},false,'ui.notFound');
await check('verification outage resets busy state',{purchases:[purchase],fetchError:true},false,'ui.purchaseError');
await check('store query failure resets busy state',{queryError:true},false,'ui.purchaseError');
await check('native Apple restore keeps existing StoreKit behavior',{os:'ios',purchases:[purchase]},true,'ui.restored');
assert.ok(!restore.includes('setTimeout'));
console.log(tests+' purchase restore logic tests passed');

