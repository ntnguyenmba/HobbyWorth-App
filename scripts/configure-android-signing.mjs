import {readFile,writeFile} from 'node:fs/promises';

const file='android/app/build.gradle';
let text=await readFile(file,'utf8');

const debugBlock=`    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const releaseBlock=`    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('HOBBYWORTH_UPLOAD_STORE_FILE')) {
                storeFile file(HOBBYWORTH_UPLOAD_STORE_FILE)
                storePassword HOBBYWORTH_UPLOAD_STORE_PASSWORD
                keyAlias HOBBYWORTH_UPLOAD_KEY_ALIAS
                keyPassword HOBBYWORTH_UPLOAD_KEY_PASSWORD
            }
        }
    }`;

if(!text.includes('release {\n            if (project.hasProperty(\'HOBBYWORTH_UPLOAD_STORE_FILE\'))')){
  if(!text.includes(debugBlock))throw new Error('Expected Expo signingConfigs block was not found.');
  text=text.replace(debugBlock,releaseBlock);
}

text=text.replace(
  '            signingConfig signingConfigs.debug\n            def enableShrinkResources',
  `            if (project.hasProperty('HOBBYWORTH_UPLOAD_STORE_FILE')) {
                signingConfig signingConfigs.release
            } else {
                throw new GradleException('Missing HobbyWorth release signing properties in ~/.gradle/gradle.properties')
            }
            def enableShrinkResources`
);

await writeFile(file,text);
console.log('Configured HobbyWorth Android release signing.');
