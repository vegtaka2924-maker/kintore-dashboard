import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCSV, parseInBody, numOrNull, normHead } from '../src/csv.js';

const dir = dirname(fileURLToPath(import.meta.url));
const fx = name => readFileSync(join(dir, 'fixtures', name), 'utf8');
const full = fx('InBody-20260505.csv');      // 全履歴・旧列順
const single = fx('InBody-20260227.csv');    // 1行・新列順・三重引用符

describe('low-level helpers', () => {
  it('numOrNull treats "-" and empty as null, parses numbers', () => {
    expect(numOrNull('-')).toBeNull();
    expect(numOrNull('')).toBeNull();
    expect(numOrNull('79.8')).toBe(79.8);
  });
  it('normHead strips BOM and spaces', () => {
    expect(normHead('﻿日付')).toBe('日付');
    expect(normHead(' 下肢筋力レベル(Level) ')).toBe('下肢筋力レベル(Level)');
  });
  it('parseCSV handles triple-quoted field (RFC4180 escaping)', () => {
    const rows = parseCSV('a,b\n"""20260227163051""",x\n');
    expect(rows[1][0]).toBe('"20260227163051"');
  });
});

describe('parseInBody — column-order independence', () => {
  const a = parseInBody(full)[0];   // 2026-05-05, device 570
  const b = parseInBody(single)[0]; // 2026-02-27, device 270 (different column order)

  it('reads correct values despite different column orders', () => {
    expect(a.date).toBe('2026-05-05');
    expect(a.weight).toBe(79.8);
    expect(a.smm).toBe(38.8);
    expect(b.date).toBe('2026-02-27');   // from """20260227163051"""
    expect(b.weight).toBe(78.5);
    expect(b.smm).toBe(37.4);
  });
  it('maps left/right by header name, not position (orders differ across files)', () => {
    expect(a.armR).toBe(3.87); expect(a.armL).toBe(3.99);
    expect(b.armR).toBe(3.72); expect(b.armL).toBe(3.79);
  });
  it('BMI and score are present (not accidentally null)', () => {
    expect(a.score).toBe(90);
    expect(a.bmi).toBeGreaterThan(20);
  });
  it('id is derived from ts (ts-unique)', () => {
    expect(a.id).toBe('ib-20260505000340');
    expect(b.id).toBe('ib-20260227163051');
  });
});

describe('parseInBody — missing values and device differences', () => {
  const recs = parseInBody(full);
  it('H20N device rows have null segmental data (kept as null, not 0)', () => {
    const h20 = recs.find(r => r.device === 'H20N');
    expect(h20).toBeTruthy();
    expect(h20.armR).toBeNull();
    expect(h20.weight).not.toBeNull(); // weight still present
  });
});

describe('cross-file dedup logic (by id = ib-ts)', () => {
  it('the measurement present in all 3 files collapses to one (2 of 3 are dup)', () => {
    const texts = [full, single, fx('InBody-20260302.csv')];
    const seen = new Set();
    let total = 0, dup = 0;
    for (const t of texts) for (const r of parseInBody(t)) { total++; if (seen.has(r.id)) dup++; else seen.add(r.id); }
    // 20260227163051 appears in all three → 2 duplicates removed
    expect(dup).toBe(2);
    expect(seen.size).toBe(total - dup);
  });
});
