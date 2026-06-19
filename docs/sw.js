/* 自動生成（build-deploy.cjs）。公開用。 */
const CACHE = 'gym-v1.1.0';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/calc.js",
  "./src/charts.js",
  "./src/constants.js",
  "./src/csv.js",
  "./src/db.js",
  "./src/forms.js",
  "./src/handlers.js",
  "./src/io.js",
  "./src/main.js",
  "./src/store.js",
  "./src/toast.js",
  "./src/types.js",
  "./src/util.js",
  "./src/views.js",
  "https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// next-session.html は「常に最新版」が必要なため network-first。それ以外は cache-first（従来通り）。
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('next-session.html')) {
    // network-first: まずネットから取得し、失敗したときだけキャッシュを返す。キャッシュには保存しない。
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    // cache-first: キャッシュがあればそれを返す（従来通り）。
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return res;
    }).catch(() => hit)));
  }
});
