/* 計算ユーティリティ（純粋・テスト対象）。Sには依存しない（weightsを引数で受ける）。 */
import { DAY } from './constants.js';
import { parseDate } from './util.js';

/** カレンダー基準 過去7日窓の移動平均/中央値。7日分の幅が無い序盤は出力しない。
 *  @param {{date:string,kg:number}[]} weights @param {boolean} median
 *  @returns {[number,number][]} [tMs, value] の配列 */
export function rolling(weights, median) {
  const pts = weights.map(w => ({ t: parseDate(w.date).getTime(), v: w.kg })).sort((a, b) => a.t - b.t);
  if (!pts.length) return [];
  const first = pts[0].t;
  /** @type {[number,number][]} */
  const out = [];
  for (const p of pts) {
    if (p.t < first + 6 * DAY) continue;                 // 序盤（7日未満の幅）は線を引かない
    const win = pts.filter(x => x.t <= p.t && x.t > p.t - 7 * DAY).map(x => x.v);
    if (win.length < 2) continue;
    let v;
    if (median) { const s = [...win].sort((a, b) => a - b); const m = s.length >> 1; v = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
    else v = win.reduce((a, b) => a + b, 0) / win.length;
    out.push([p.t, +v.toFixed(2)]);
  }
  return out;
}

/** 最新の7日移動平均値（無ければnull）。 */
export function latestMA(weights) { const r = rolling(weights, false); return r.length ? r[r.length - 1][1] : null; }

/** daysAgo日前の時点に最も近い（それ以前の最後の）移動平均値。 */
export function maAt(weights, daysAgo) {
  const r = rolling(weights, false); if (!r.length) return null;
  const target = Date.now() - daysAgo * DAY; let best = null;
  for (const [t, v] of r) { if (t <= target) best = v; }
  return best != null ? best : r[0][1];
}

/** 推定1RM（Epley）。呼び出し側で reps≤12 に限定する契約。 */
export const epley = (w, reps) => w * (1 + reps / 30);

/** 種目名 → 筋群分類（キーワード）。 */
export const MUSCLE_OF = ex => {
  const s = ex; const has = a => a.some(k => s.includes(k));
  if (has(['ベンチ', 'チェスト', 'ダンベルプレス', 'プッシュアップ', 'ペック', 'ディップ'])) return '胸';
  if (has(['スクワット', 'レッグ', 'カーフ', 'ハック', 'ランジ', 'デッドリフト', 'ヒップ'])) return '脚';
  if (has(['ロウ', '懸垂', 'プル', 'ラット', 'チンニング', 'デッド'])) return '背中';
  if (has(['ショルダー', 'サイドレイズ', 'フロント', 'リア', 'オーバーヘッド', 'アップライト'])) return '肩';
  if (has(['カール', 'バイセップ'])) return '腕(二頭)';
  if (has(['トライセップ', 'プレスダウン', 'エクステンション', 'キックバック'])) return '腕(三頭)';
  if (has(['クランチ', 'アブ', '腹', 'プランク', 'レッグレイズ'])) return '腹';
  return 'その他';
};

/** 週キー（月曜起点のYYYY-MM-DD）。toISOString()はローカル日付をUTCにずらすため使わず、ローカルで整形。 */
export const weekKey = d => {
  const dt = parseDate(d); const day = (dt.getDay() + 6) % 7; dt.setDate(dt.getDate() - day);
  const p = n => String(n).padStart(2, '0');
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
};
