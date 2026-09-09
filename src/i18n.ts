import * as Localization from 'expo-localization';
import en from './locales/en.json';import es from './locales/es.json';import vi from './locales/vi.json';import fr from './locales/fr.json';import de from './locales/de.json';import zh from './locales/zh-Hans.json';import {LocaleCode} from './types';
const dict:Record<LocaleCode,any>={en,es,vi,fr,de,'zh-Hans':zh};export const locales:LocaleCode[]=['en','es','vi','fr','de','zh-Hans'];
export function deviceLocale():LocaleCode{const x=Localization.getLocales()[0],tag=x?.languageTag?.toLowerCase()||'',lang=x?.languageCode||'en';if(tag.startsWith('zh-hans')||(lang==='zh'&&!tag.includes('hant')))return'zh-Hans';return locales.includes(lang as LocaleCode)?lang as LocaleCode:'en'}
const path=(o:any,k:string)=>k.split('.').reduce((a,p)=>a?.[p],o);
export function tr(l:LocaleCode,k:string,p:Record<string,string|number>={}){let v=path(dict[l],k);if(typeof v!=='string'){console.warn(`[i18n] missing ${l}:${k}`);v=path(dict.en,k)}if(typeof v!=='string')return'';return Object.entries(p).reduce((s,[a,b])=>s.replaceAll(`{${a}}`,String(b)),v)}
export function arr(l:LocaleCode,k:string){let v=path(dict[l],k);if(!Array.isArray(v)){console.warn(`[i18n] missing ${l}:${k}`);v=path(dict.en,k)}return Array.isArray(v)?v.map(String):[]}
export const localeName=(l:LocaleCode)=>dict[l].localeName as string;
export function hobbyName(id:string){return id.split('-').map(x=>x==='3d'?'3D':x==='cricut'?'Cricut':x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
