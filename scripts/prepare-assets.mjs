import {mkdir,copyFile,stat,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';

const out='assets/generated';
const sourceRepo='https://github.com/ntnguyenmba/HobbyWorth.git';
const files=['hero.PNG','baking.PNG','cooking.PNG','drinks.PNG','painting.PNG','knitting.PNG','sewing.PNG','planting.PNG','handyman.PNG','photography.PNG','coding.PNG'];
const iconSource='423E1857-AA50-41D4-8265-B88EB2F4F3CD.png';

await mkdir(out,{recursive:true});

async function hasFile(path){
  try{return (await stat(path)).size>1000}catch{return false}
}

const needed=[...files,iconSource];
const missing=[];
for(const file of needed){
  const target=file===iconSource?join(out,'icon.png'):join(out,file);
  if(!(await hasFile(target)))missing.push(file);
}

let sourceDir=null;
try{
  if(missing.length){
    sourceDir=await mkdtemp(join(tmpdir(),'hobbyworth-assets-'));
    execFileSync('git',['clone','--depth','1','--branch','main',sourceRepo,sourceDir],{stdio:'inherit'});
  }

  async function prepare(source,target){
    const targetPath=join(out,target);
    if(await hasFile(targetPath))return;
    const sourcePath=join(sourceDir,source);
    if(!(await hasFile(sourcePath)))throw new Error(`Source asset missing: ${source}`);
    await copyFile(sourcePath,targetPath);
    console.log(`Prepared ${target}`);
  }

  for(const file of files)await prepare(file,file);
  await prepare(iconSource,'logo.PNG');
  await prepare(iconSource,'icon.png');
  await prepare(iconSource,'adaptive-icon.png');
  await prepare('hero.PNG','splash.png');
}finally{
  if(sourceDir)await rm(sourceDir,{recursive:true,force:true});
}
