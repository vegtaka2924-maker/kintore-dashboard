/* IndexedDB の無知な CRUD ラッパ（アプリ知識を持たない）。
   スキーマ進化は onupgradeneeded の oldVersion 分岐で。今はインデックス無し（全件getAll→JSソート）。 */
const DB_NAME = 'gym-dashboard';
const DB_VERSION = 1;
const STORES = ['weights', 'inbody', 'workouts', 'regimes', 'backups'];

let _db = null;

export function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const d = r.result;
      // v0 → v1: 基本ストア作成。将来は e.oldVersion で段階移行。
      STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
    };
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror = () => rej(r.error);
  });
}
const tx = (store, mode) => _db.transaction(store, mode).objectStore(store);
export const all   = store      => new Promise((res, rej) => { const r = tx(store, 'readonly').getAll();   r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const put   = (store, v)  => new Promise((res, rej) => { const r = tx(store, 'readwrite').put(v);    r.onsuccess = () => res();          r.onerror = () => rej(r.error); });
export const del   = (store, id) => new Promise((res, rej) => { const r = tx(store, 'readwrite').delete(id);r.onsuccess = () => res();          r.onerror = () => rej(r.error); });
export const clear = store      => new Promise((res, rej) => { const r = tx(store, 'readwrite').clear();   r.onsuccess = () => res();          r.onerror = () => rej(r.error); });
