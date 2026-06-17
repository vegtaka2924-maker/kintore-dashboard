import { describe, it, expect } from 'vitest';
import { rolling, epley, MUSCLE_OF, weekKey } from '../src/calc.js';

// 連続n日の体重列を作る
function series(start, kgs) {
  const base = new Date(start + 'T00:00:00');
  return kgs.map((kg, i) => { const d = new Date(base.getTime() + i * 86400000); return { date: d.toISOString().slice(0, 10), kg }; });
}

describe('rolling — calendar 7-day window', () => {
  it('outputs nothing until 7 days of span exist (first 6 days skipped)', () => {
    const w = series('2026-01-01', [80, 80, 80, 80, 80]); // 5 days
    expect(rolling(w, false)).toHaveLength(0);
  });
  it('produces a mean once span >= 7 days', () => {
    const w = series('2026-01-01', [80, 80, 80, 80, 80, 80, 80]); // 7 days
    const r = rolling(w, false);
    expect(r.length).toBe(1);
    expect(r[0][1]).toBeCloseTo(80, 5);
  });
  it('median mode returns the middle value, robust to one outlier', () => {
    const w = series('2026-01-01', [80, 80, 80, 80, 80, 80, 90]); // last day spikes
    const mean = rolling(w, false)[0][1];
    const med = rolling(w, true)[0][1];
    expect(med).toBe(80);          // median ignores the spike
    expect(mean).toBeGreaterThan(80); // mean is pulled up
  });
});

describe('epley estimated 1RM', () => {
  it('matches the Epley formula', () => {
    expect(epley(100, 1)).toBeCloseTo(103.33, 1);
    expect(epley(80, 8)).toBeCloseTo(101.33, 1);
  });
});

describe('MUSCLE_OF classification', () => {
  it('maps common exercises to muscle groups', () => {
    expect(MUSCLE_OF('ベンチプレス')).toBe('胸');
    expect(MUSCLE_OF('バーベルスクワット')).toBe('脚');
    expect(MUSCLE_OF('ラットプルダウン')).toBe('背中');
    expect(MUSCLE_OF('サイドレイズ')).toBe('肩');
    expect(MUSCLE_OF('未知の種目')).toBe('その他');
  });
});

describe('weekKey', () => {
  it('returns the Monday of the week', () => {
    expect(weekKey('2026-06-17')).toBe('2026-06-15'); // Wed → Mon
    expect(weekKey('2026-06-15')).toBe('2026-06-15'); // Mon → Mon
  });
});
