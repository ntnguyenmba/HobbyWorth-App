import {mkdir,copyFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';

const out='assets/generated';
const sourceRepo='https://github.com/ntnguyenmba/HobbyWorth.git';
const files=['hero.PNG','baking.PNG','cooking.PNG','drinks.PNG','painting.PNG','knitting.PNG','sewing.PNG','planting.PNG','handyman.PNG','photography.PNG','coding.PNG'];
const iconSource='423E1857-AA50-41D4-8265-B88EB2F4F3CD.png';

async function assertAsset(path,label){
  const info=await stat(path);
  if(info.size<1000)throw new Error(`Source asset is too small: ${label}`);
}

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

const sourceDir=await mkdtemp(join(tmpdir(),'hobbyworth-assets-'));
try{
  execFileSync('git',['clone','--depth','1','--branch','main',sourceRepo,sourceDir],{stdio:'inherit'});

  async function prepare(source,target){
    const sourcePath=join(sourceDir,source);
    const targetPath=join(out,target);
    await assertAsset(sourcePath,source);
    await copyFile(sourcePath,targetPath);
    console.log(`Prepared ${target}`);
  }

  for(const file of files){
    await prepare(file,file.replace(/\.PNG$/,'.png'));
  }
  await prepare(iconSource,'logo.png');
  await prepare(iconSource,'icon.png');
  await prepare(iconSource,'adaptive-icon.png');
  await prepare('hero.PNG','splash.png');
}finally{
  await rm(sourceDir,{recursive:true,force:true});
}
