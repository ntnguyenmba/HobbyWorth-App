import {readFile} from 'node:fs/promises';

function keys(o, p = '') {
  if (Array.isArray(o)) return [p];
  if (o && typeof o === 'object') {
    return Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k));
  }
  return [p];
}

const files = ['en', 'es', 'vi', 'fr', 'de', 'zh-Hans'];
const dicts = {};
for (const file of files) {
  dicts[file] = JSON.parse(await readFile(new URL(`../src/locales/${file}.json`, import.meta.url), 'utf8'));
}
const en = keys(dicts.en).sort();
let ok = true;
for (const file of files) {
  const found = keys(dicts[file]).sort();
  const missing = en.filter((k) => !found.includes(k));
  const extra = found.filter((k) => !en.includes(k));
  if (missing.length || extra.length) {
    console.error(`${file} locale keys differ`, {missing, extra});
    ok = false;
  }
}

const native = {};
for (const file of files) {
  native[file] = JSON.parse(await readFile(new URL(`../native-locales/${file}.json`, import.meta.url), 'utf8'));
}
const nativeEn = keys(native.en).sort();
for (const file of files) {
  const found = keys(native[file]).sort();
  const missing = nativeEn.filter((k) => !found.includes(k));
  const extra = found.filter((k) => !nativeEn.includes(k));
  if (missing.length || extra.length) {
    console.error(`${file} native-locale keys differ`, {missing, extra});
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log('locale keys match across en, es, vi, fr, de, zh-Hans');
