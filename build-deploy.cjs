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

  // 2c) カードを「ホーム画面アプリ（PWA）」として開くための設定とアイコン。
  //     存在する場合のみコピー（アドレスバー無しの全画面でカードを開けるようにする）。
  for (const f of ['card.webmanifest', 'icon-card.svg', 'icon-card-192.png', 'icon-card-512.png']) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) copy(src, path.join(OUT, f));
  }

  // 3) manifest（start_url/scopeを公開ルート用に "./" へ）
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  man.start_url = './'; man.scope = './';
  fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(man, null, 2));

  // 4) sw.js（★自滅SW）
  //   かつてはオフライン用に cache-first でアセットを保存していたが、それが原因で
  //   スマホに「古いカード（next-session.html）が出続ける」問題が起きた。
  //   この用途にオフライン保存は過剰なので Service Worker を廃止する。
  //   ただし既存端末には古いSWが残っているため、その古いSWが更新チェックで
  //   この sw.js を読み込んだとき、自分自身を消して素のWebページに戻すようにする。
  //   ・addAll を一切使わない＝install は必ず成功し、確実に activate される
  //   ・activate で全キャッシュを削除 → 開いている画面に再読込を通知 → 最後に自分を登録解除
  //   ・fetch ハンドラを置かない＝以後すべてのリクエストがネット直行（HTTPキャッシュのみ有効）
  const consts = fs.readFileSync(path.join(ROOT, 'src', 'constants.js'), 'utf8');
  const version = (consts.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/) || [, '0.0.0'])[1];
  const sw = `/* 自動生成（build-deploy.cjs）。自滅SW：旧キャッシュとSW自身を消して素のサイトへ戻す。 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  // 1) 全キャッシュを削除
  for (const k of await caches.keys()) await caches.delete(k);
  // 2) 開いている画面に「リロードして」と通知（clients.navigate より堅牢）
  const cs = await self.clients.matchAll({ type: 'window' });
  for (const c of cs) c.postMessage('sw-bye');
  // 3) 最後に自分を登録解除（通知を先・unregister を最後に）
  await self.registration.unregister();
})()));
// fetch ハンドラは置かない＝全リクエストがネット直行
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
