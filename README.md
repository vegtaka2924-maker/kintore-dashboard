# 筋トレ ダッシュボード

筋トレを「データを取って科学的に」進めるための個人用ダッシュボード（PWA・ノービルド）。
主指標は **骨格筋量 + 体重**。ダーク×ネオン（ライム＝筋肉 / アンバー＝脂肪）。

> ⚠️ このリポジトリには**アプリのコードだけ**を置きます。InBodyの測定値や日々の記録（健康データ）は
> 各端末のブラウザ（IndexedDB）に保存され、**リポジトリには含めません**（`.gitignore` で構造的に除外）。

## 公開（スマホでアプリとして使う）
GitHub Pages を **main ブランチ / `docs` フォルダ** から配信します。設定 → Pages で選ぶだけ。
公開URLをスマホで開き「ホーム画面に追加」すると、オフラインでも動くアプリになります。
詳細は [DEPLOY.md](DEPLOY.md)。

## 開発
- ローカル起動：`node server.cjs`（または `start-gym.cmd`）→ http://localhost:8765
- テスト：`npm test`（Vitest）／型チェック：`npm run typecheck`（tsc, ビルドなし）
- 公開フォルダ再生成：`node build-deploy.cjs` → `docs/`
- SW版：`src/constants.js` の `APP_VERSION` を上げると `gen-sw.cjs` / `build-deploy.cjs` が反映

## 構成
- `dashboard.html` + `src/*.js`（14 ESMモジュール）／`docs/`（公開ビルド）
- 正本＝IndexedDB（端末内）。端末間は JSON のエクスポート/インポートで同期（LWWで後退防止）。
