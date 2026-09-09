import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import {State,Project} from './types';
const KEY='hobbyworth.state.v1',DIR=`${FS.documentDirectory}project-photos/`;
export async function load(fallback:State){try{const x=await AsyncStorage.getItem(KEY);return x?{...fallback,...JSON.parse(x)}:fallback}catch{return fallback}}
export const save=(s:State)=>AsyncStorage.setItem(KEY,JSON.stringify(s));
export async function keepPhoto(uri:string,id:string){const i=await FS.getInfoAsync(DIR);if(!i.exists)await FS.makeDirectoryAsync(DIR,{intermediates:true});const dest=`${DIR}${id}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;await FS.copyAsync({from:uri,to:dest});return dest}
export async function deletePhotos(p:Project){for(const uri of p.photos){try{await FS.deleteAsync(uri,{idempotent:true})}catch{}}}
export async function clearAll(){await AsyncStorage.removeItem(KEY);try{await FS.deleteAsync(DIR,{idempotent:true})}catch{}}
