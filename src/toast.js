/* 軽量トースト通知 */
import { $ } from './util.js';
let _t;
export function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_t); _t = setTimeout(() => el.classList.remove('show'), 2200);
}
