/* sw.js を自動生成。APP_VERSION（src/constants.js）とsrc/*.js一覧から
   CACHE名とASSETSを注入し、版/一覧の二重管理を断つ。server.js起動時に毎回実行。 */
const fs = require('fs'), path = require('path');
const ROOT = __dirname;

function generate() {
  const consts = fs.readFileSync(path.join(ROOT, 'src', 'constants.js'), 'utf8');
  const m = consts.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
  const version = m ? m[1] : '0.0.0';
  const srcFiles = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).sort().map(f => './src/' + f);
  const assets = ['./dashboard.html', './manifest.webmanifest', ...srcFiles,
    'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js'];

  const sw = `/* 自動生成（gen-sw.js）。手で編集しない。版は src/constants.js の APP_VERSION。 */
const CACHE = 'gym-v${version}';
const ASSETS = ${JSON.stringify(assets, null, 2)};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
`;
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  return { version, count: assets.length };
}

module.exports = { generate };
if (require.main === module) { const r = generate(); console.log('sw.js generated: v' + r.version + ' (' + r.count + ' assets)'); }
