/* InBody CSV パーサ（純粋・テスト対象）。
   実データの罠に対応：列順が2種混在 / 三重引用符の日付 / BOM / "-"欠損 / 機種別の欠損 / 14桁日付。 */
import { COLMAP } from './constants.js';

/** RFC4180準拠パーサ（引用符・""エスケープ・改行対応）。split(',')は使わない。 */
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // BOM除去
  const rows = []; let row = [], field = '', i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } q = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { q = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

export const normHead = h => (h || '').replace(/^﻿/, '').replace(/\s+/g, '').trim();
export const numOrNull = v => {
  v = (v || '').trim();
  if (v === '' || v === '-') return null;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
};

/** CSVテキスト → InBodyRec[]（列名マッピング・dedupは呼び出し側）。 */
export function parseInBody(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const heads = rows[0].map(normHead);
  const idx = {}; heads.forEach((h, i) => { if (COLMAP[h] !== undefined) idx[COLMAP[h]] = i; });
  if (idx.ts === undefined || idx.weight === undefined) return []; // フォーマット不一致
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (!row || row.length < 2) continue;
    const tsRaw = (row[idx.ts] || '').trim().replace(/"/g, ''); // 三重引用符の名残も除去
    if (!/^\d{8,14}/.test(tsRaw)) continue;
    const date = tsRaw.slice(0, 4) + '-' + tsRaw.slice(4, 6) + '-' + tsRaw.slice(6, 8);
    const rec = { id: 'ib-' + tsRaw, ts: tsRaw, date };
    for (const k in idx) {
      if (k === 'ts') continue;
      const v = row[idx[k]];
      rec[k] = (k === 'device') ? (v || '').trim() : numOrNull(v);
    }
    out.push(rec);
  }
  return out;
}
