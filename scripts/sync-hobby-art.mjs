import { mkdir, writeFile, stat } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/ntnguyenmba/HobbyWorth/main';
const files = [
  'hero.PNG',
  'baking.PNG',
  'cooking.PNG',
  'photography.PNG',
  'painting.PNG',
  'hiking.PNG',
  'knitting.PNG',
  'sewing.PNG',
  'writing.PNG',
  'coding.PNG',
];

await mkdir(new URL('../assets/hobbies/', import.meta.url), { recursive: true });

for (const sourceName of files) {
  const targetName = sourceName.replace(/\.PNG$/i, '.png');
  const targetUrl = new URL(`../assets/hobbies/${targetName}`, import.meta.url);
  const response = await fetch(`${SOURCE}/${sourceName}`);
  if (!response.ok) {
    throw new Error(`Could not download ${sourceName}: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 10000) {
    throw new Error(`${sourceName} downloaded as an unexpectedly small file (${bytes.length} bytes)`);
  }
  await writeFile(targetUrl, bytes);
  const info = await stat(targetUrl);
  console.log(`${targetName}: ${info.size} bytes`);
}

console.log('HobbyWorth artwork synced locally for offline use.');
