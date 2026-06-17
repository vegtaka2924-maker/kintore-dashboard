/* ECharts 描画層（DOM要素に対してチャートを描く）。echartsはCDNグローバル。 */
import { C, DAY } from './constants.js';
import { $, fmt, parseDate } from './util.js';
import { S } from './store.js';
import { rolling, epley, MUSCLE_OF } from './calc.js';

/* global echarts */
const charts = {};
export function mkChart(el) { const c = echarts.init($(el), null, { renderer: 'canvas' }); charts[el] = c; return c; }
export function resizeAll() { Object.values(charts).forEach(c => c.resize()); }

const baseGrid = { left: 48, right: 16, top: 20, bottom: 30 };
const axisStyle = { axisLine: { lineStyle: { color: C.border } }, axisLabel: { color: C.muted }, splitLine: { lineStyle: { color: '#1b2027' } } };

export function spark(sel, data, color) {
  if (!charts[sel]) mkChart(sel);
  charts[sel].setOption({
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { color, width: 2 }, areaStyle: { color, opacity: 0.12 } }],
  }, true);
}

export function renderWeight() {
  if (!charts['#cWeight']) mkChart('#cWeight');
  const cut = S.wRangeDays ? Date.now() - S.wRangeDays * DAY : 0;
  const raw = S.weights.filter(w => parseDate(w.date).getTime() >= cut).map(w => [parseDate(w.date).getTime(), w.kg]);
  const ma = rolling(S.weights, S.wMedian).filter(p => p[0] >= cut);
  let band = [];
  if (ma.length) {
    const t0 = ma[0][0], v0 = ma[0][1];
    band = ma.map(p => { const mo = (p[0] - t0) / DAY / 30; return [p[0], +(v0 + 0.5 * mo).toFixed(2), +(v0 + 1.0 * mo).toFixed(2)]; });
  }
  charts['#cWeight'].setOption({
    grid: baseGrid, tooltip: { trigger: 'axis', valueFormatter: v => v == null ? '-' : v + 'kg' },
    xAxis: Object.assign({ type: 'time' }, axisStyle),
    yAxis: Object.assign({ type: 'value', scale: true, name: 'kg' }, axisStyle),
    series: [
      { name: '目標下限', type: 'line', data: band.map(b => [b[0], b[1]]), lineStyle: { opacity: 0 }, symbol: 'none', stack: 'band', silent: true },
      { name: '目標バンド', type: 'line', data: band.map(b => [b[0], b[2] - b[1]]), lineStyle: { opacity: 0 }, symbol: 'none', stack: 'band', silent: true, areaStyle: { color: C.lime, opacity: 0.08 } },
      { name: '体重(生)', type: 'scatter', data: raw, symbolSize: 4, itemStyle: { color: '#3a4756' } },
      { name: (S.wMedian ? '7日中央値' : '7日平均'), type: 'line', data: ma, smooth: true, symbol: 'none', lineStyle: { color: C.cyan, width: 3 } },
    ],
  }, true);
}

export function renderComp() {
  const has = S.inbody.some(r => r.smm != null && r.fatMass != null);
  $('#compEmpty').style.display = has ? 'none' : 'block';
  $('#cComp').style.display = has ? 'block' : 'none';
  if (!has) return;
  if (!charts['#cComp']) mkChart('#cComp');
  const rows = S.inbody.filter(r => r.smm != null);
  charts['#cComp'].setOption({
    grid: baseGrid, legend: { textStyle: { color: C.muted }, top: 0 },
    tooltip: { trigger: 'axis', valueFormatter: v => v == null ? '-' : v + 'kg' },
    xAxis: Object.assign({ type: 'category', data: rows.map(r => r.date) }, axisStyle),
    yAxis: Object.assign({ type: 'value', name: 'kg', min: 0 }, axisStyle),
    series: [
      { name: '骨格筋量', type: 'line', stack: 'b', areaStyle: { color: C.lime, opacity: 0.85 }, lineStyle: { color: C.lime }, itemStyle: { color: C.lime }, symbol: 'none', data: rows.map(r => r.smm) },
      { name: '体脂肪量', type: 'line', stack: 'b', areaStyle: { color: C.amber, opacity: 0.7 }, lineStyle: { color: C.amber }, itemStyle: { color: C.amber }, symbol: 'none', data: rows.map(r => r.fatMass) },
    ],
  }, true);
}

export function renderSegment() {
  const seg = S.inbody.filter(r => r.armR != null && r.armL != null && r.trunk != null && r.legR != null && r.legL != null);
  const has = seg.length > 0;
  $('#segEmpty').style.display = has ? 'none' : 'block';
  $('#cRadar').style.display = has ? 'block' : 'none';
  if (!has) { $('#lrBox').innerHTML = ''; $('#lrNote').textContent = ''; return; }
  const cur = seg[seg.length - 1];
  const fields = [['右腕', 'armR'], ['左腕', 'armL'], ['体幹', 'trunk'], ['右脚', 'legR'], ['左脚', 'legL']];
  const ranges = {}; fields.forEach(([_, k]) => { const vs = seg.map(r => r[k]); ranges[k] = [Math.min(...vs), Math.max(...vs)]; });
  if (!charts['#cRadar']) mkChart('#cRadar');
  charts['#cRadar'].setOption({
    radar: {
      indicator: fields.map(([n]) => ({ name: n, max: 100, min: 0 })), axisName: { color: C.muted },
      splitLine: { lineStyle: { color: '#1b2027' } }, splitArea: { areaStyle: { color: ['#12181f', '#0e131a'] } }, axisLine: { lineStyle: { color: C.border } },
    },
    series: [{ type: 'radar', data: [{ value: fields.map(([_, k]) => { const [mn, mx] = ranges[k]; return mx > mn ? Math.round((cur[k] - mn) / (mx - mn) * 100) : 50; }), name: '部位別(個人内正規化)', areaStyle: { color: C.lime, opacity: 0.25 }, lineStyle: { color: C.lime }, itemStyle: { color: C.lime } }] }],
  }, true);
  const lr = (a, b, label) => {
    const diff = Math.abs(a - b) / ((a + b) / 2) * 100; const warn = diff > 5;
    return '<div class="regrow"><span>' + label + ' <span class="muted">' + fmt(a) + ' / ' + fmt(b) + 'kg</span></span>' +
      '<span style="color:' + (warn ? 'var(--amber)' : 'var(--lime)') + '">差 ' + fmt(diff) + '% ' + (warn ? '⚠ 要注意' : '✓ 良好') + '</span></div>';
  };
  $('#lrBox').innerHTML = '<div class="sub">左右バランス（右/左）</div>' + lr(cur.armR, cur.armL, '腕') + lr(cur.legR, cur.legL, '脚');
}

export function renderTraining() {
  const has = S.workouts.length > 0;
  $('#trainEmpty').style.display = has ? 'none' : 'block';
  const exs = [...new Set(S.workouts.map(w => w.ex))];
  $('#exSelect').innerHTML = exs.map(e => '<option>' + e + '</option>').join('');
  $('#exList').innerHTML = exs.map(e => '<option value="' + e + '">').join('');
  if (!has) { ['#c1rm', '#cVol', '#cHeat'].forEach(s => charts[s] && charts[s].clear()); return; }
  render1RM($('#exSelect').value || exs[0]);
  renderVolume(); renderHeat();
}

export function render1RM(ex) {
  if (!charts['#c1rm']) mkChart('#c1rm');
  const pts = S.workouts.filter(w => w.ex === ex).map(w => {
    const best = Math.max(0, ...w.sets.filter(s => s.reps > 0 && s.reps <= 12).map(s => epley(s.w, s.reps)));
    return best > 0 ? [w.date, +best.toFixed(1)] : null;
  }).filter(Boolean);
  charts['#c1rm'].setOption({
    grid: baseGrid, tooltip: { trigger: 'axis', valueFormatter: v => v + 'kg' },
    xAxis: Object.assign({ type: 'category', data: pts.map(p => p[0]) }, axisStyle),
    yAxis: Object.assign({ type: 'value', name: '推定1RM kg', scale: true }, axisStyle),
    series: [{ type: 'line', data: pts.map(p => p[1]), smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { color: C.lime, width: 2 }, itemStyle: { color: C.lime } }],
  }, true);
}

export function renderVolume() {
  if (!charts['#cVol']) mkChart('#cVol');
  const now = Date.now(); const recent = S.workouts.filter(w => parseDate(w.date).getTime() > now - 7 * DAY);
  const byG = {}; recent.forEach(w => { const g = MUSCLE_OF(w.ex); byG[g] = (byG[g] || 0) + w.sets.length; });
  const g = Object.keys(byG);
  charts['#cVol'].setOption({
    grid: { left: 70, right: 16, top: 10, bottom: 24 }, tooltip: {},
    xAxis: Object.assign({ type: 'value', name: 'セット' }, axisStyle),
    yAxis: Object.assign({ type: 'category', data: g }, axisStyle),
    series: [{ type: 'bar', data: g.map(k => byG[k]), itemStyle: { color: C.lime, borderRadius: [0, 4, 4, 0] } }],
  }, true);
}

export function renderHeat() {
  if (!charts['#cHeat']) mkChart('#cHeat');
  const cnt = {}; S.workouts.forEach(w => cnt[w.date] = (cnt[w.date] || 0) + 1);
  const year = new Date().getFullYear();
  charts['#cHeat'].setOption({
    tooltip: { formatter: p => p.value[0] + ' : ' + p.value[1] + '回' },
    visualMap: { show: false, min: 0, max: 2, inRange: { color: ['#1b2027', C.lime] } },
    calendar: { range: year, cellSize: ['auto', 13], itemStyle: { color: '#12181f', borderColor: C.bg }, dayLabel: { color: C.muted }, monthLabel: { color: C.muted }, yearLabel: { show: false }, splitLine: { lineStyle: { color: C.border } } },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: Object.entries(cnt).map(([d, v]) => [d, v]) }],
  }, true);
}
