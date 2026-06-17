/* イベント結線。store操作 → reload → 描画 → toast を束ねるオーケストレーション層。 */
import { $, $$, todayStr } from './util.js';
import { S, reloadAll, saveWeight, saveWorkout, addRegime, setRange, setMedian } from './store.js';
import { renderAll, renderRegimes } from './views.js';
import { renderWeight, renderTraining, render1RM, resizeAll } from './charts.js';
import { setRow, renderTags, addSameSet, cloneLast, getWorkoutInput, resetForm } from './forms.js';
import { importCSVFiles, doExport, doImport } from './io.js';
import { toast } from './toast.js';

async function onSaveWeight() {
  const kg = parseFloat($('#wInput').value);
  try { await saveWeight(kg); } catch (e) { toast('体重の値を確認してください'); return; }
  await reloadAll(); renderAll(); toast('今日の体重を記録しました ✓');
}

async function onSaveWorkout() {
  const { ex, date, sets, note, tags } = getWorkoutInput();
  if (!ex) { toast('種目を入力してください'); return; }
  if (!sets.length) { toast('セットを入力してください'); return; }
  // 外れ値アラート（前回同種目トップセット比 ±40%超）
  $('#wkAlert').textContent = '';
  const last = [...S.workouts].reverse().find(w => w.ex === ex);
  if (last) {
    const lt = Math.max(...last.sets.map(s => s.w)), nt = Math.max(...sets.map(s => s.w));
    if (lt > 0 && Math.abs(nt - lt) / lt > 0.4) $('#wkAlert').textContent = '⚠ 前回(' + lt + 'kg)から大きく変化。入力ミスでないか確認を。';
  }
  await saveWorkout({ date, ex, sets, note, tags });
  await reloadAll(); renderTraining(); resetForm();
  toast('トレ記録を保存しました ✓');
}

async function onAddRegime() {
  const name = $('#regName').value.trim(); if (!name) { toast('名称を入力'); return; }
  await addRegime({ name, dose: $('#regDose').value.trim(), start: $('#regDate').value || todayStr() });
  $('#regName').value = ''; $('#regDose').value = '';
  await reloadAll(); renderRegimes(); toast('レジームを追加');
}

export function wire() {
  const step = d => { $('#wInput').value = (parseFloat($('#wInput').value || 0) + d).toFixed(1); };
  $('#wMinus').onclick = () => step(-0.1);
  $('#wPlus').onclick = () => step(0.1);
  $('#wSave').onclick = onSaveWeight;
  $('#fab').onclick = () => { $('#today').scrollIntoView({ behavior: 'smooth' }); $('#wInput').focus(); };

  $$('#wRange [data-d]').forEach(b => b.onclick = () => {
    $$('#wRange [data-d]').forEach(x => x.classList.remove('on')); b.classList.add('on');
    setRange(+b.dataset.d); renderWeight();
  });
  $('#medBtn').onclick = () => { setMedian(!S.wMedian); $('#medBtn').classList.toggle('on', S.wMedian); renderWeight(); };

  $('#exSelect').onchange = () => render1RM($('#exSelect').value);
  $('#addSet').onclick = () => setRow();
  $('#addSameSet').onclick = addSameSet;
  $('#wkClone').onclick = cloneLast;
  $('#wkSave').onclick = onSaveWorkout;
  $('#regAdd').onclick = onAddRegime;

  const drop = $('#drop'), file = $('#file');
  drop.onclick = () => file.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('hot'); };
  drop.ondragleave = () => drop.classList.remove('hot');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('hot'); importCSVFiles([...e.dataTransfer.files]); };
  file.onchange = () => importCSVFiles([...file.files]);

  $('#exportBtn').onclick = doExport;
  $('#importJsonBtn').onclick = () => $('#jsonFile').click();
  $('#jsonFile').onchange = () => doImport($('#jsonFile').files[0]);

  addEventListener('resize', resizeAll);
}
