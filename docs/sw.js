/* 自動生成（build-deploy.cjs）。自滅SW：旧キャッシュとSW自身を消して素のサイトへ戻す。 */
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
