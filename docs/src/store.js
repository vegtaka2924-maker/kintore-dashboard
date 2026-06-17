/* アプリ状態 S とデータ操作。DOM/描画/トーストには依存しない（純データ層）。
   ★データ安全：全レコードに updatedAt を付与。インポートはLWWマージ＋事前自動バックアップ。 */
import * as DB from './db.js';
import { parseInBody } from './csv.js';
import { todayStr } from './util.js';

/** 単一の共有状態。再代入禁止・プロパティ変異のみ。更新は本モジュールの関数経由。 */
export const S = { weights: [], inbody: [], workouts: [], regimes: [], wRangeDays: 90, wMedian: false };

const now = () => Date.now();

/** IndexedDB → S に全件ロード（読み取り側はSを参照）。 */
export async function reloadAll() {
  S.weights  = (await DB.all('weights')).sort((a, b) => a.date < b.date ? -1 : 1);
  S.inbody   = (await DB.all('inbody')).sort((a, b) => a.ts < b.ts ? -1 : 1);
  S.workouts = (await DB.all('workouts')).sort((a, b) => a.date < b.date ? -1 : 1);
  S.regimes  = await DB.all('regimes');
}

export function setRange(days) { S.wRangeDays = days; }
export function setMedian(on)  { S.wMedian = on; }

/** 自動世代バックアップ（7世代ローテート）。backupsはエクスポートに含めない＝同一端末内限定。 */
export async function snapshot() {
  await DB.put('backups', { id: 'bk-' + now(), at: now(), data: await exportObj() });
  const bks = (await DB.all('backups')).sort((a, b) => b.at - a.at);
  for (const b of bks.slice(7)) await DB.del('backups', b.id);
}

/** @returns {Promise<import('./types.js').ExportBundle>} */
export async function exportObj() {
  return {
    version: 1, exportedAt: new Date().toISOString(),
    weights: await DB.all('weights'), inbody: await DB.all('inbody'),
    workouts: await DB.all('workouts'), regimes: await DB.all('regimes'),
  };
}

/* ---- 保存（updatedAt付与） ---- */
export async function saveWeight(kg) {
  if (!(kg > 20 && kg < 300)) throw new Error('weight out of range');
  await DB.put('weights', { id: todayStr(), date: todayStr(), kg: +kg.toFixed(1), updatedAt: now() });
  await snapshot();
}
export async function saveWorkout({ date, ex, sets, note, tags }) {
  await DB.put('workouts', { id: 'wk-' + date + '-' + ex + '-' + now(), date, ex, sets, note, tags, updatedAt: now() });
  await snapshot();
}
export async function addRegime({ name, dose, start }) {
  await DB.put('regimes', { id: 'rg-' + now(), name, dose, start, updatedAt: now() });
}
export async function delRegime(id) { await DB.del('regimes', id); }

/** InBody CSVテキスト群を取り込み（ts重複はidで冪等put）。@returns {{added:number,dup:number,skipped:number}} */
export async function importInBodyTexts(texts) {
  let added = 0, dup = 0, skipped = 0;
  const existing = new Set(S.inbody.map(r => r.id));
  for (const text of texts) {
    const recs = parseInBody(text);
    if (!recs.length) { skipped++; continue; }
    for (const r of recs) {
      if (existing.has(r.id)) { dup++; continue; }
      existing.add(r.id);
      await DB.put('inbody', { ...r, updatedAt: now() });
      added++;
    }
  }
  if (added) await snapshot();
  return { added, dup, skipped };
}

/** LWW判定（純粋・テスト対象）：取り込むべきか。既存が新しければ後退させない。 */
export function lwwShouldPut(existing, incoming) {
  if (!incoming || incoming.id == null) return false;
  if (!existing) return true;
  return (incoming.updatedAt || 0) >= (existing.updatedAt || 0);
}

/** JSONバンドルをLWWマージ。事前に自動バックアップ。@returns {{merged:number,skipped:number}} */
export async function importMerge(bundle) {
  await snapshot(); // 巻き戻し用
  const stores = ['weights', 'inbody', 'workouts', 'regimes'];
  let merged = 0, skipped = 0;
  for (const s of stores) {
    const cur = new Map((await DB.all(s)).map(r => [r.id, r]));
    for (const inc of (bundle[s] || [])) {
      if (lwwShouldPut(cur.get(inc.id), inc)) { await DB.put(s, inc); merged++; }
      else skipped++;
    }
  }
  return { merged, skipped };
}
