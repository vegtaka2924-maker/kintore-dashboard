/* ファイル入出力（CSV取込・JSONエクスポート/インポート）。decodeはここ、parseはstore/csv。 */
import { $, todayStr } from './util.js';
import { exportObj, importInBodyTexts, importMerge, reloadAll } from './store.js';
import { renderAll } from './views.js';
import { toast } from './toast.js';

async function decode(file) {
  const buf = await file.arrayBuffer();
  let text;
  try { text = new TextDecoder('utf-8', { fatal: false }).decode(buf); }
  catch (e) { text = new TextDecoder('shift_jis').decode(buf); }
  if (/�/.test(text)) { try { text = new TextDecoder('shift_jis').decode(buf); } catch (e) { /* keep */ } } // 文字化けフォールバック
  return text;
}

export async function importCSVFiles(files) {
  try {
    const texts = [];
    for (const f of files) texts.push(await decode(f));
    const { added, dup, skipped } = await importInBodyTexts(texts);
    await reloadAll(); renderAll();
    $('#importMsg').textContent = '取込完了：新規 ' + added + ' 件 / 重複スキップ ' + dup + ' 件' + (skipped ? ' / 形式不一致 ' + skipped + ' ファイル' : '');
  } catch (e) { console.error(e); toast('取込に失敗しました'); }
}

export async function doExport() {
  const o = await exportObj();
  const blob = new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gym-data-' + todayStr() + '.json'; a.click();
  toast('エクスポートしました（OneDriveのexports等に保存推奨）');
}

export async function doImport(file) {
  try {
    const bundle = JSON.parse(await file.text());
    const { merged, skipped } = await importMerge(bundle);
    await reloadAll(); renderAll();
    toast('インポート：反映 ' + merged + ' 件 / 後退回避でスキップ ' + skipped + ' 件');
  } catch (e) { console.error(e); toast('インポートに失敗しました（JSONを確認）'); }
}
