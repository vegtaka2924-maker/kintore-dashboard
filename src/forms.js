/* トレ記録入力フォーム（DOM操作）。 */
import { TAGS } from './constants.js';
import { $, $$, todayStr } from './util.js';
import { S } from './store.js';
import { toast } from './toast.js';

const selTags = new Set();

export function setRow(w = '', reps = '') {
  const d = document.createElement('div'); d.className = 'setline';
  d.innerHTML = '<span class="si"></span><input type="number" step="2.5" class="sw" placeholder="kg" value="' + w + '" style="width:90px"><span class="muted">kg ×</span><input type="number" class="sr" placeholder="回" value="' + reps + '" style="width:70px"><span class="muted">回</span><button class="btn rm" style="height:34px">×</button>';
  d.querySelector('.rm').addEventListener('click', () => { d.remove(); renumber(); });
  $('#setRows').appendChild(d); renumber();
}
export function renumber() { $$('#setRows .setline').forEach((r, i) => r.querySelector('.si').textContent = (i + 1)); }

export function renderTags() {
  $('#tagChips').innerHTML = TAGS.map(t => '<span class="tag" data-t="' + t + '" style="cursor:pointer;margin:2px;opacity:' + (selTags.has(t) ? 1 : .4) + '">' + t + '</span>').join('');
  $$('#tagChips [data-t]').forEach(c => c.onclick = () => { const t = c.dataset.t; selTags.has(t) ? selTags.delete(t) : selTags.add(t); renderTags(); });
}

export function addSameSet() {
  const rows = $$('#setRows .setline');
  if (rows.length) { const l = rows[rows.length - 1]; setRow(l.querySelector('.sw').value, l.querySelector('.sr').value); }
  else setRow();
}

export function cloneLast() {
  const ex = $('#wkEx').value.trim(); if (!ex) { toast('種目を入力してください'); return; }
  const last = [...S.workouts].reverse().find(w => w.ex === ex); if (!last) { toast('前回の記録がありません'); return; }
  $('#setRows').innerHTML = ''; last.sets.forEach(s => setRow(s.w, s.reps)); toast('前回(' + last.date + ')を複製しました');
}

/** フォームから入力を読み取る（数値化・空セット除去）。 */
export function getWorkoutInput() {
  const ex = $('#wkEx').value.trim(), date = $('#wkDate').value || todayStr();
  const sets = $$('#setRows .setline')
    .map(r => ({ w: parseFloat(r.querySelector('.sw').value), reps: parseInt(r.querySelector('.sr').value) }))
    .filter(s => s.w > 0 && s.reps > 0);
  return { ex, date, sets, note: $('#wkNote').value.trim(), tags: [...selTags] };
}

export function resetForm() {
  $('#setRows').innerHTML = ''; setRow(); $('#wkNote').value = ''; selTags.clear(); renderTags();
}
