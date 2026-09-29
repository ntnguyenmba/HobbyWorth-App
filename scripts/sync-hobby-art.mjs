import { mkdtemp, mkdir, copyFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  'cleaning.PNG',
  'drinks.PNG',
  'farmersmarket.PNG',
  'guitar.PNG',
  'handyman.PNG',
  'hobbymakeoney.PNG',
  'planting.PNG',
];

const outDir = fileURLToPath(new URL('../assets/hobbies/', import.meta.url));
await mkdir(outDir, { recursive: true });

const temp = await mkdtemp(join(tmpdir(), 'hobbyworth-art-'));
const sourceDir = join(temp, 'HobbyWorth');

try {
  execFileSync('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/ntnguyenmba/HobbyWorth.git',
    sourceDir,
  ], { stdio: 'inherit' });

  for (const sourceName of files) {
    const targetName = sourceName.replace(/\.PNG$/i, '.png');
    const sourcePath = join(sourceDir, sourceName);
    const targetPath = join(outDir, targetName);
    await copyFile(sourcePath, targetPath);
    const info = await stat(targetPath);
    if (info.size < 10000) {
      throw new Error(`${targetName} is unexpectedly small (${info.size} bytes)`);
    }
    console.log(`${targetName}: ${info.size} bytes`);
  }

  console.log('HobbyWorth artwork synced locally for offline use.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
