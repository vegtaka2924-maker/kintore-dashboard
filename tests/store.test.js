import { describe, it, expect } from 'vitest';
import { lwwShouldPut } from '../src/store.js';

describe('lwwShouldPut — データを後退させないLWW判定', () => {
  it('既存が無ければ取り込む', () => {
    expect(lwwShouldPut(undefined, { id: 'a', updatedAt: 1 })).toBe(true);
  });
  it('取り込み側が新しければ上書き', () => {
    expect(lwwShouldPut({ id: 'a', updatedAt: 100 }, { id: 'a', updatedAt: 200 })).toBe(true);
  });
  it('既存の方が新しければ取り込まない（後退防止）', () => {
    expect(lwwShouldPut({ id: 'a', updatedAt: 200 }, { id: 'a', updatedAt: 100 })).toBe(false);
  });
  it('同時刻なら冪等に取り込む（同値上書き）', () => {
    expect(lwwShouldPut({ id: 'a', updatedAt: 100 }, { id: 'a', updatedAt: 100 })).toBe(true);
  });
  it('idが無い不正レコードは弾く', () => {
    expect(lwwShouldPut(undefined, { updatedAt: 1 })).toBe(false);
    expect(lwwShouldPut(undefined, null)).toBe(false);
  });
  it('updatedAt欠落は0扱い（旧データに新データが勝つ）', () => {
    expect(lwwShouldPut({ id: 'a' }, { id: 'a', updatedAt: 1 })).toBe(true);
    expect(lwwShouldPut({ id: 'a', updatedAt: 1 }, { id: 'a' })).toBe(false);
  });
});
