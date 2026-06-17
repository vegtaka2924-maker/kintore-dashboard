/* KPI・ヒーロー・今日入力・継続・レジームのDOM描画＋renderAll。 */
import { C, GOAL_KG, QUARTER_GAIN, DAY } from './constants.js';
import { $, $$, fmt, todayStr, parseDate } from './util.js';
import { S, reloadAll, delRegime } from './store.js';
import { latestMA, maAt } from './calc.js';
import { spark, renderWeight, renderComp, renderSegment, renderTraining } from './charts.js';

export function renderToday() {
  $('#todayDate').textContent = '(' + todayStr() + ')';
  const w = S.weights.find(w => w.date === todayStr());
  if (w) { $('#todayState').innerHTML = '✓ 記録済み <b style="color:var(--lime)">' + fmt(w.kg) + 'kg</b>'; $('#wInput').value = w.kg; }
  else { $('#todayState').textContent = '未記録'; const l = latestMA(S.weights); if (l) $('#wInput').value = fmt(l); }
}

export function setDelta(sel, d, label, unit, inverse) {
  const el = $(sel); if (d == null) { el.className = 'delta flat small'; el.textContent = label + ' –'; return; }
  let cls = d > 0.001 ? 'up' : d < -0.001 ? 'down' : 'flat'; if (inverse && cls !== 'flat') cls = cls === 'up' ? 'down' : 'up';
  const sign = d > 0 ? '+' : ''; el.className = 'delta ' + cls + ' small';
  el.textContent = label + ' ' + (d > 0 ? '▲' : d < 0 ? '▼' : '—') + ' ' + sign + fmt(d) + unit;
}

function last28Series() {
  const now = Date.now(), arr = [];
  for (let i = 27; i >= 0; i--) { const d = new Date(now - i * DAY).toISOString().slice(0, 10); arr.push(S.weights.some(w => w.date === d) ? 1 : 0); }
  return arr;
}

export function renderStreaks() {
  const now = Date.now();
  const days = new Set(S.weights.filter(w => parseDate(w.date).getTime() > now - 28 * DAY).map(w => w.date));
  const rate = Math.round(days.size / 28 * 100);
  $('#stWeight').textContent = rate; $('#kC').textContent = rate + '%';
  $('#kCd').textContent = '直近28日 体重 ' + days.size + '/28日';
  const tdays = new Set(S.workouts.filter(w => parseDate(w.date).getTime() > now - 7 * DAY).map(w => w.date));
  $('#stTrain').textContent = tdays.size;
  spark('#spC', last28Series(), C.lime);
}

export function renderHeroKPI() {
  const ma = latestMA(S.weights);
  $('#heroW').textContent = fmt(ma);
  const ib = S.inbody[S.inbody.length - 1];
  $('#heroSmm').textContent = ib ? fmt(ib.smm) : '–';
  const prev = maAt(S.weights, 7);
  if (ma != null && prev != null) {
    const d = ma - prev; const cls = d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat'; const sign = d > 0 ? '+' : '';
    $('#heroDelta').className = 'delta ' + cls;
    $('#heroDelta').textContent = '7日平均 ' + (d > 0 ? '▲' : d < 0 ? '▼' : '—') + ' ' + sign + fmt(d) + 'kg/週';
  }
  const anchor = maAt(S.weights, 90) ?? ma;
  if (ma != null && anchor != null) {
    const target = anchor + QUARTER_GAIN;
    const prog = Math.max(0, Math.min(1, (ma - anchor) / (target - anchor || 1)));
    $('#heroFill').style.width = (prog * 100).toFixed(0) + '%';
    $('#heroSub').textContent = '今四半期の中間目標：' + fmt(anchor) + ' → ' + fmt(target) + 'kg（最終目標 ' + GOAL_KG + 'kg）';
    $('#heroMiles').innerHTML = '<span>現在 ' + fmt(ma) + 'kg</span><span>目標 ' + fmt(target) + 'kg</span>';
  }
  $('#kW').textContent = fmt(ma);
  setDelta('#kWd', ma != null && prev != null ? ma - prev : null, '前週比', ' kg');
  spark('#spW', latestMASeries(), C.cyan);
  const ib2 = S.inbody.slice(-2);
  $('#kM').textContent = ib ? fmt(ib.smm) : '–';
  $('#kF').textContent = ib ? fmt(ib.bodyFat) : '–';
  if (ib2.length === 2) { setDelta('#kMd', ib2[1].smm - ib2[0].smm, '前回比', ' kg'); setDelta('#kFd', ib2[1].bodyFat - ib2[0].bodyFat, '前回比', ' %', true); }
  spark('#spM', S.inbody.map(r => r.smm), C.lime);
  spark('#spF', S.inbody.map(r => r.bodyFat), C.amber);
  renderStreaks();
}
import { rolling } from './calc.js';
function latestMASeries() { return rolling(S.weights, false).map(p => p[1]); }

export function renderRegimes() {
  $('#regList').innerHTML = S.regimes.length ? S.regimes.map(r =>
    '<div class="regrow"><span><span class="tag">' + r.name + '</span> ' + r.dose + ' <span class="muted small">' + r.start + '〜</span></span>' +
    '<button class="btn" data-del="' + r.id + '" style="height:30px;padding:0 10px">削除</button></div>').join('')
    : '<div class="muted small">まだありません。クレアチン等を追加してください。</div>';
  $$('#regList [data-del]').forEach(b => b.onclick = async () => { await delRegime(b.dataset.del); await reloadAll(); renderRegimes(); });
}

export function renderAll() {
  renderToday(); renderHeroKPI(); renderWeight(); renderComp(); renderSegment(); renderTraining(); renderRegimes();
}
