import {mkdir,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

const root='https://raw.githubusercontent.com/ntnguyenmba/HobbyWorth/main';
const out='assets/generated';
const files=['hero.PNG','baking.PNG','cooking.PNG','drinks.PNG','painting.PNG','knitting.PNG','sewing.PNG','planting.PNG','handyman.PNG','photography.PNG','coding.PNG'];
const iconSource='423E1857-AA50-41D4-8265-B88EB2F4F3CD.png';

await mkdir(out,{recursive:true});

async function download(source,target){
  const path=join(out,target);
  try{const s=await stat(path);if(s.size>1000)return;}catch{}
  const response=await fetch(`${root}/${encodeURIComponent(source)}`);
  if(!response.ok)throw new Error(`Could not fetch ${source}: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<1000)throw new Error(`Downloaded asset is too small: ${source}`);
  await writeFile(path,bytes);
  console.log(`Prepared ${target}`);
}

for(const file of files)await download(file,file);
await download(iconSource,'logo.PNG');
await download(iconSource,'icon.png');
await download(iconSource,'adaptive-icon.png');
await download('hero.PNG','splash.png');
