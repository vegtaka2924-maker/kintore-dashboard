/* 起動：DB初期化 → 初期DOM → ロード → イベント結線 → 描画。
   DB初期化失敗時は劣化運用（白画面にしない）。 */
import { $, todayStr } from './util.js';
import * as DB from './db.js';
import { reloadAll } from './store.js';
import { renderAll } from './views.js';
import { wire } from './handlers.js';
import { setRow, renderTags } from './forms.js';
import { toast } from './toast.js';

async function init() {
  // フォーム初期値は先に（DB失敗時も入力UIは出す）
  $('#wkDate').value = todayStr();
  $('#regDate').value = todayStr();
  setRow(); renderTags();

  try {
    await DB.open();
  } catch (e) {
    console.error(e);
    const t = $('#todayState');
    if (t) t.innerHTML = '<span style="color:var(--amber)">⚠ データ保存が使えません（プライベートモード/容量不足？）。閲覧のみ。</span>';
    toast('IndexedDBを開けませんでした');
    return;
  }
  await reloadAll();
  wire();
  renderAll();
}
init();
