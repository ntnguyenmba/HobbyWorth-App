import {readFile} from 'node:fs/promises';

const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const expected = 'com.everittventures.hobbyworth.lifetime';
const extra = app.expo?.extra || {};

if (extra.iosIapProductId !== expected || extra.androidIapProductId !== expected) throw new Error('Apple and Google lifetime product IDs must match the production ID.');
if (JSON.stringify(app).includes('ca-app-pub-3940256099942544')) throw new Error('Google sample AdMob IDs may not ship.');
if (app.expo?.android?.jsEngine === 'jsc') throw new Error('Android must use Hermes.');
if (Object.values(pkg.scripts || {}).some((value) => String(value).includes('prepare-assets'))) throw new Error('Install and build scripts may not clone artwork.');

console.log('store IDs, Hermes, AdMob, and asset configuration passed');
