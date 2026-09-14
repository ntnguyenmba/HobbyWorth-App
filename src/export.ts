import * as FS from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {hobbyName, tr} from './i18n';
import {calc} from './math';
import {LocaleCode, Project} from './types';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char] || char));
const money = (value: number, symbol: string) => `${symbol}${Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2).replace(/\.00$/, '')}`;

async function embeddedPhotos(photos: string[]) {
  const values: {name: string; mimeType: string; data: string}[] = [];
  for (let index = 0; index < photos.length; index += 1) {
    try {
      const data = await FS.readAsStringAsync(photos[index], {encoding: FS.EncodingType.Base64});
      values.push({name: `project-photo-${index + 1}.jpg`, mimeType: 'image/jpeg', data});
    } catch {}
  }
  return values;
}

export async function exportProjectBackup(project: Project, locale: LocaleCode) {
  const file = `${FS.cacheDirectory}hobbyworth-${project.id}.json`;
  const photos = await embeddedPhotos(project.photos);
  await FS.writeAsStringAsync(file, JSON.stringify({schemaVersion: 2, project: {...project, photos: []}, photos}, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file, {mimeType: 'application/json', dialogTitle: tr(locale, 'ui.exportJson')});
}

export async function exportProjectPdf(project: Project, locale: LocaleCode, symbol: string) {
  const result = calc(project.numbers, project.split);
  const photos = await embeddedPhotos(project.photos);
  const photoHtml = photos.map((photo) => `<img src="data:${photo.mimeType};base64,${photo.data}" style="width:47%;margin:1%;border-radius:12px" />`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system;color:#243238;padding:28px}h1{font-size:30px;margin:0 0 8px}h2{color:#1F5F70;margin:0 0 24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.card{border:1px solid #D6CFC4;border-radius:12px;padding:12px}.label{color:#3E5158;font-size:12px}.value{font-size:20px;font-weight:700}.photos{margin-top:20px}</style></head><body><h1>HobbyWorth</h1><h2>${escapeHtml(hobbyName(project.hobbyId, locale))}</h2><div class="grid"><div class="card"><div class="label">${escapeHtml(tr(locale, 'ui.cost'))}</div><div class="value">${money(result.cost, symbol)}</div></div><div class="card"><div class="label">${escapeHtml(tr(locale, 'ui.left'))}</div><div class="value">${money(result.leftover, symbol)}</div></div><div class="card"><div class="label">${escapeHtml(tr(locale, 'ui.unit'))}</div><div class="value">${money(result.perUnit, symbol)}</div></div><div class="card"><div class="label">${escapeHtml(tr(locale, 'ui.hour'))}</div><div class="value">${money(result.perHour, symbol)}</div></div></div>${project.note ? `<p>${escapeHtml(project.note)}</p>` : ''}<div class="photos">${photoHtml}</div></body></html>`;
  const pdf = await Print.printToFileAsync({html});
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(pdf.uri, {mimeType: 'application/pdf', dialogTitle: tr(locale, 'ui.exportPdf')});
}
