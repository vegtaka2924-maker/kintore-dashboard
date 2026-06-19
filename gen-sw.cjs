/* sw.js を自動生成。★自滅SW版。
   かつてはオフライン用に cache-first でアセットを保存していたが、それが原因で
   スマホに「古いカードが出続ける」問題が起きたため Service Worker を廃止した。
   ここでは本番（build-deploy.cjs）と同じ「自滅SW」を生成し、ローカルと本番の挙動を一致させる。
   server.cjs 起動時に毎回実行される。 */
const fs = require('fs'), path = require('path');
const ROOT = __dirname;

function generate() {
  const sw = `/* 自動生成（gen-sw.cjs）。自滅SW：旧キャッシュとSW自身を消して素のサイトへ戻す。 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  // 1) 全キャッシュを削除
  for (const k of await caches.keys()) await caches.delete(k);
  // 2) 開いている画面に「リロードして」と通知
  const cs = await self.clients.matchAll({ type: 'window' });
  for (const c of cs) c.postMessage('sw-bye');
  // 3) 最後に自分を登録解除
  await self.registration.unregister();
})()));
// fetch ハンドラは置かない＝全リクエストがネット直行
`;
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  return { ok: true };
}

module.exports = { generate };
if (require.main === module) { generate(); console.log('sw.js generated: self-destruct SW'); }
