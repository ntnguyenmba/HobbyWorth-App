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

const sourceToTarget=new Map(files.map(file=>[file,file.replace(/\.PNG$/,'.png')]));
sourceToTarget.set(iconSource,'icon.png');

const needed=[];
for(const [source,target] of sourceToTarget){
  if(!(await hasFile(join(out,target))))needed.push(source);
}

let sourceDir=null;
try{
  if(needed.length){
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

  for(const [source,target] of sourceToTarget)await prepare(source,target);
  await prepare(iconSource,'logo.png');
  await prepare(iconSource,'adaptive-icon.png');
  await prepare('hero.PNG','splash.png');
}finally{
  if(sourceDir)await rm(sourceDir,{recursive:true,force:true});
}
