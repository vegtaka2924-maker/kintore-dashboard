/* 公開用フォルダ deploy/ を安全に生成する。
   ★ホワイトリスト方式：アプリのコードだけをコピーし、健康データ（InBodyデータ/・exports/）は絶対に含めない。
   使い方: node build-deploy.cjs  → deploy/ をNetlify Drop等にドラッグして公開。 */
const fs = require('fs'), path = require('path');
// GitHub Pages の標準「/docs」を公開フォルダにする（Netlifyにドラッグする場合もこのdocsでOK）
const ROOT = __dirname, OUT = path.join(ROOT, 'docs');

// 念のため、絶対に公開してはいけないものを明示（コピー対象に入っていないが二重の歯止め）
const FORBIDDEN = ['InBodyデータ', 'exports', 'tests', 'node_modules', 'package.json', 'package-lock.json'];

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copy(src, dst) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }

function build() {
  rmrf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  // 1) dashboard.html → index.html（バレURLでそのまま開けるように）
  copy(path.join(ROOT, 'dashboard.html'), path.join(OUT, 'index.html'));

  // 2) src/*.js をコピー（.d.ts等は不要なので .js のみ）
  const srcFiles = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js'));
  for (const f of srcFiles) copy(path.join(ROOT, 'src', f), path.join(OUT, 'src', f));

  // 2b) next-session.html（トレーニングごとに作戦カードを更新する。存在する場合のみコピー）
  const nextSessionSrc = path.join(ROOT, 'next-session.html');
  if (fs.existsSync(nextSessionSrc)) {
    copy(nextSessionSrc, path.join(OUT, 'next-session.html'));
  }

  // 3) manifest（start_url/scopeを公開ルート用に "./" へ）
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  man.start_url = './'; man.scope = './';
  fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(man, null, 2));

  // 4) sw.js（公開用ASSETS。エントリは ./index.html）
  const consts = fs.readFileSync(path.join(ROOT, 'src', 'constants.js'), 'utf8');
  const version = (consts.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/) || [, '0.0.0'])[1];
  const assets = ['./', './index.html', './manifest.webmanifest', ...srcFiles.map(f => './src/' + f),
    'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js'];
  const sw = `/* 自動生成（build-deploy.cjs）。公開用。 */
const CACHE = 'gym-v${version}';
const ASSETS = ${JSON.stringify(assets, null, 2)};
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
`;
  fs.writeFileSync(path.join(OUT, 'sw.js'), sw);

  // 5) 安全確認：禁止物が紛れていないか
  const leaked = FORBIDDEN.filter(n => fs.existsSync(path.join(OUT, n)));
  if (leaked.length) throw new Error('公開フォルダに禁止物が混入: ' + leaked.join(', '));

  const list = fs.readdirSync(OUT);
  console.log('docs/ を生成しました（v' + version + '）。内容:', list.join(', '));
  console.log('→ GitHub Pages（main / docs）か、https://app.netlify.com/drop へドラッグで公開。健康データ（CSV）は含まれていません。');
  return list;
}

module.exports = { build };
if (require.main === module) build();
