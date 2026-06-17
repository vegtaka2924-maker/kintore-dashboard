/* DOM・整形の小ヘルパ */
/** @returns {any} 利便のためan; 呼び出し側は要素型を前提にしてよい */
export const $  = s => document.querySelector(s);
/** @returns {any[]} */
export const $$ = s => [...document.querySelectorAll(s)];
export const fmt = (n, d = 1) => (n == null || isNaN(n)) ? '–' : Number(n).toFixed(d);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
