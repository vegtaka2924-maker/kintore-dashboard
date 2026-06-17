# スマホでも使う：GitHub Pages で公開する手順

スマホで「アプリのように毎日入力（オフライン可）」するため、アプリのコードを GitHub Pages（無料）に置きます。

> ✅ **あなたの健康データ（InBody CSV・記録）は公開されません。**
> このリポジトリは `.gitignore` で `InBodyデータ/`・`exports/`・テストのfixtureを**構造的に除外**しており、
> 公開されるのは空のアプリのコードだけ。データは各端末のブラウザ（IndexedDB）に保存されます。
> （ローカルで確認済み：追跡ファイルに `.csv` は0件）

---

## あなたがやること

### 1. GitHubアカウントを作る（無料・カード不要）
https://github.com/signup → メールとパスワードだけ。

### 2. 空のリポジトリを作る
- 右上 ＋ →「New repository」
- Repository name：例 `kintore-dashboard`
- **Public** のままでOK（公開されるのはコードだけ。健康データは含まれない）
- 「Add a README」等は**チェックしない**（空のまま作る）
- 「Create repository」

### 3. 手元のコードをアップ（ターミナルで3行）
作成後の画面に出る `…/kintore-dashboard.git` のURLを使い、`筋トレ` フォルダで：
```
git remote add origin https://github.com/<あなたのユーザー名>/kintore-dashboard.git
git push -u origin main
```
- 初回の `git push` で**ブラウザが開き、GitHubログインを求められます**（Git同梱の認証マネージャ）。ログインすれば完了。

### 4. GitHub Pages を有効化
- リポジトリの **Settings → Pages**
- Source：**Deploy from a branch**
- Branch：**main** ／ フォルダ：**/docs** を選んで **Save**
- 1〜2分待つと、上部に公開URL `https://<ユーザー名>.github.io/kintore-dashboard/` が出る ← これがアプリ

### 5. スマホで使う
1. そのURLをスマホのブラウザで開く
2. メニュー →「**ホーム画面に追加**」。アイコンができ、オフラインでも動く
3. ⑧「InBody CSV取込」でCSVを入れ、以後は ⓪ で毎日1タップ入力

PCでも同じURLを開けばOK（`start-gym.cmd` は開発用。日常はURLで十分）。

---

## データの扱い（重要）
- データは**端末ごと**にその端末のブラウザ内へ保存（PCとスマホは別々）。
- 揃えたいとき：片方で ⑧「エクスポート(JSON)」→ もう片方に送って「インポート」。
  インポートは**新しい記録を古いデータで上書きしない**（後退防止）安全設計。
- 月1でエクスポートして OneDrive 等に置けば、それが本当のバックアップ。

## コードを更新したとき
```
node build-deploy.cjs      # docs/ を作り直す（健康データ混入を自動チェック）
git add -A && git commit -m "update"
git push
```
- 数分でPagesが更新。アプリを開き直すと新版に切替（版は `src/constants.js` の `APP_VERSION` を上げる）。

## Netlify でやりたい場合（代替）
`docs/` フォルダを https://app.netlify.com/drop にドラッグするだけでも公開できます。
