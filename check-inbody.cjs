/* =============================================================================
   InBody 取りこぼしチェッカー（2026-07-01 新設）
   ─────────────────────────────────────────────────────────────────────────
   ■なぜ作ったか
     InBodyの測定は「CSV」と「画像(PNG/JPG)」が混在する。一括エクスポートCSVに
     大半が入るが、画像でしか渡されない回がある。CSVだけ見ると画像単独の回が
     構造的に視界から漏れる。実際 2026-06-04 の測定が画像のみで見落とされた。
     その再発を“機械が”止めるためのチェッカー。

   ■何をするか（読むだけ。何も書き換えない・公開しない）
     (A) 画像はあるのに対応CSVが無い測定 → 画像をCSV化せよ（最重要）
     (B) CSVにあるのにカード(src/data.js の inbody配列)へ未反映の測定
         ※カードは「直近の抜粋」なので、配列の開始日より新しいものだけ対象にする
     (C) トレーニングログ.csv と src/data.js の log[] のズレ（2026-07-07 追加）
         ※トレ記録も「CSV＝一次記録」と「data.js＝アプリ表示」の二重管理なので、
           InBodyと同じく片方だけ更新する事故が起きる（実際 6/28・6/30 の回が
           data.js にはあるのに CSV へ追記されていなかった）。
     (D) data.js の内部整合（2026-07-07 追加）
         ※currentKey の送り忘れ・sessionsDone の +1 忘れ・attendance の追加忘れは
           画面が普通に表示されてしまい気づけないので、機械で突き合わせる。
     どれか1件でもあれば一覧表示して終了コード1で止まる。

   ■使い方
     node check-inbody.cjs        （単体チェック ＝ npm run check）
     npm run release              （チェック→公開ビルド を一括。赤なら止まる）
   ============================================================================= */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'InBodyデータ');   // 健康データ（gitignore済み）
const DATA = path.join(__dirname, 'src', 'data.js'); // カードの表示データ

// 数字8桁(YYYYMMDD) → "YYYY-MM-DD"
function ymd(d8) { return d8.slice(0, 4) + '-' + d8.slice(4, 6) + '-' + d8.slice(6, 8); }
// CSVの各セルから引用符と空白を除去（InBodyは日付が """…""" の三重引用符のことがある）
function clean(s) { return (s || '').replace(/"/g, '').trim(); }

// --- 1) 画像ファイルの測定日（ファイル名の数字8桁）を集める -------------------
const imageDates = {}; // "YYYY-MM-DD" -> ファイル名
for (const f of fs.readdirSync(DIR)) {
  if (!/\.(png|jpe?g)$/i.test(f)) continue;
  const m = f.match(/(\d{8})/); // ファイル名に含まれる YYYYMMDD を測定日とみなす
  if (m) imageDates[ymd(m[1])] = f;
}

// --- 2) CSVを読み、測定日→主要3値を集める（列順2種・BOM・三重引用符に対応） -----
const csvRows = {}; // "YYYY-MM-DD" -> { weight, muscle, fat, file }
for (const f of fs.readdirSync(DIR)) {
  if (!/^InBody-.*\.csv$/i.test(f)) continue;
  const text = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/^﻿/, ''); // BOM除去
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) continue;
  const head = lines[0].split(',').map(clean);
  const col = (name) => head.indexOf(name);            // 列名で位置を引く＝列順2種を吸収
  const iT = col('日付'), iW = col('体重(kg)'), iM = col('骨格筋量(kg)'), iF = col('体脂肪率(%)');
  for (let r = 1; r < lines.length; r++) {
    const c = lines[r].split(',').map(clean);
    const ts = (c[iT] || '').replace(/\D/g, ''); // 数字だけにする（三重引用符・記号対策）
    if (ts.length < 8) continue;
    // 同じ測定日が複数ファイルにあっても（2/27の列順違い2本など）日付キーで集約＝重複無害化
    csvRows[ymd(ts)] = { weight: c[iW], muscle: c[iM], fat: c[iF], file: f };
  }
}

// --- 3) src/data.js の inbody配列（カードの折れ線グラフ用）を読む ---------------
const win = {};
new Function('window', fs.readFileSync(DATA, 'utf8'))(win); // build-deploy.cjs と同手法
const card = (win.KINTORE_DATA && win.KINTORE_DATA.inbody) || [];
const cardDates = new Set(card.map((r) => r.date));
const cardStart = card.length ? card.map((r) => r.date).sort()[0] : '9999-99-99'; // 抜粋の開始日

// --- 3b) トレーニングログ.csv と src/data.js の log[] を突き合わせる ----------------
//   ■なぜ足したか（2026-07-07 追加）
//     トレ記録は「トレーニングログ.csv（一次記録）」と「data.js の log[]（アプリ表示）」の
//     二重管理で、片方だけ更新してもう片方を忘れる事故が実際に起きた
//     （例：2026-06-28 と 06-30 の回が data.js にはあるのに CSV に無かった）。
//     InBody と同じ発想で、人の注意力ではなく機械に突き合わせさせる。
const LOGCSV = path.join(__dirname, 'トレーニングログ.csv'); // 健康データ（gitignore済み）
const logCsvMissing = !fs.existsSync(LOGCSV); // CSVそのものが無い＝OneDrive同期待ちの疑い
let gapCsvSide = [];  // data.js にはあるのに CSV に無い日付（CSVへの追記漏れ）
let gapDataSide = []; // CSV にはあるのに data.js に無い日付（アプリへの反映漏れ）
if (!logCsvMissing) {
  // CSVの1列目（日付 YYYY-MM-DD）だけを拾う。ヘッダー行・空行は正規表現で自然に弾かれる。
  const csvDates = new Set();
  for (const line of fs.readFileSync(LOGCSV, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = line.match(/^(\d{4}-\d{2}-\d{2}),/);
    if (m) csvDates.add(m[1]);
  }
  const logDates = ((win.KINTORE_DATA && win.KINTORE_DATA.log) || []).map((r) => r.date);
  // data.js の log[] は途中から付け始めた抜粋なので、その開始日より古いCSV行は比較しない
  // （InBodyチェックの「カード開始日以降だけ見る」方式と同じ理屈）
  const logStart = logDates.length ? logDates.slice().sort()[0] : '9999-99-99';
  gapCsvSide = logDates.filter((d) => !csvDates.has(d)).sort();
  gapDataSide = [...csvDates].filter((d) => d >= logStart && !logDates.includes(d)).sort();
}

// --- 3c) data.js 自体の内部整合（publish-kintore の手作業ミスを検出） ---------------
//   ■なぜ足したか（2026-07-07 追加）
//     トレ報告のたびに data.js は「log 追加・currentKey 送り・sessionsDone +1・attendance 追加」を
//     すべて手で直す。どれか1つ忘れても画面は普通に表示されてしまうので、機械で突き合わせる。
const D = win.KINTORE_DATA || {};
const dataProblems = [];
const tlog = D.log || [];
if (tlog.length && Array.isArray(D.rotation) && D.rotation.length) {
  // (1) currentKey は「直近にやったセッションの次」を指しているはず（ローテの送り忘れ検出）
  const lastKey = tlog[0].sessionKey;
  const i = D.rotation.indexOf(lastKey);
  if (i >= 0) {
    const expected = D.rotation[(i + 1) % D.rotation.length];
    if (D.currentKey !== expected) {
      dataProblems.push('currentKey が "' + D.currentKey + '"（直近 ' + tlog[0].date + ' が ' + lastKey + ' なので、次は "' + expected + '" のはず。送り忘れ？）');
    }
  }
  // (2) sessionsDone は log の件数以上のはず（+1 忘れ検出。logを将来間引いても誤検出しないよう「少ない」時だけ）
  if (D.meta && typeof D.meta.sessionsDone === 'number' && D.meta.sessionsDone < tlog.length) {
    dataProblems.push('meta.sessionsDone(' + D.meta.sessionsDone + ') が log の件数(' + tlog.length + ')より少ない（+1 忘れ？）');
  }
  // (3) log にある日はカレンダー（attendance）にもあるはず（追加忘れ検出）
  const att = new Set((D.attendance || []).map((r) => r.date));
  for (const r of tlog) {
    if (!att.has(r.date)) dataProblems.push('attendance に ' + r.date + ' が無い（カレンダーへの追加忘れ）');
  }
  // (4) kaikaiくんは、実施したメニューを種目ごとに必ずコメントする。
  //     detail は自由文なので種目数の自動推定はせず、ログ入力時に exerciseReviews を明示する。
  //     この欄がない公開を止め、総評だけで種目が埋もれる事故を防ぐ。
  const reviewStart = D.meta && D.meta.coachExerciseReviewRequiredFrom;
  if (reviewStart) {
    for (const r of tlog.filter((x) => x.date >= reviewStart)) {
      if (!Array.isArray(r.exerciseReviews) || !r.exerciseReviews.length) {
        dataProblems.push('log[' + r.date + '] に exerciseReviews が無い（実施メニューごとのkaikaiくんコメントを追加）');
        continue;
      }
      r.exerciseReviews.forEach((review, i) => {
        if (!review || !review.name || !review.p) {
          dataProblems.push('log[' + r.date + '].exerciseReviews[' + i + '] が不完全（name と p が必要）');
        }
      });
    }
  }
}

// --- 4) 差分を出す -----------------------------------------------------------
// (A) 画像はあるのにCSVが無い（最重要・必ず止める）
const gapImg = Object.keys(imageDates).filter((d) => !csvRows[d]);
// (B) CSVにあるがカード未反映（カードは直近抜粋なので開始日以降だけ対象＝古い履歴は無視）
const gapCard = Object.keys(csvRows).filter((d) => d >= cardStart && !cardDates.has(d));

console.log('取りこぼしチェック（InBody＋トレーニングログ）');
console.log('  画像ファイル   : ' + Object.keys(imageDates).length + ' 件');
console.log('  CSV測定        : ' + Object.keys(csvRows).length + ' 件（重複は測定日で集約）');
console.log('  カード(inbody) : ' + cardDates.size + ' 件（直近抜粋 / 開始 ' + cardStart + '）');
console.log('  トレログCSV    : ' + (logCsvMissing ? '見つからない！' : '突き合わせ済み'));
console.log('');

const totalGaps = gapImg.length + gapCard.length + gapCsvSide.length + gapDataSide.length + (logCsvMissing ? 1 : 0) + dataProblems.length;
if (!totalGaps) {
  console.log('OK 取りこぼしはありません。');
  process.exit(0);
}
if (gapImg.length) {
  console.log('[!] 画像はあるがCSVが無い測定（画像→CSV化が必要）');
  gapImg.sort().forEach((d) => console.log('    - ' + d + '   元画像: ' + imageDates[d]));
  console.log('');
}
if (gapCard.length) {
  console.log('[!] CSVにあるがカード(inbody配列)へ未反映の測定');
  gapCard.sort().forEach((d) => {
    const r = csvRows[d];
    console.log('    - ' + d + '   体重' + r.weight + ' 骨格筋量' + r.muscle + ' 体脂肪率' + r.fat + '（' + r.file + '）');
  });
  console.log('');
}
if (logCsvMissing) {
  console.log('[!] トレーニングログ.csv が見つからない（OneDrive同期がまだ？ 同期完了を待ってから再実行）');
  console.log('');
}
if (gapCsvSide.length) {
  console.log('[!] data.js の log[] にはあるがトレーニングログ.csv に無い回（CSVへの追記漏れ）');
  gapCsvSide.forEach((d) => console.log('    - ' + d + '   → data.js の detail から実数を CSV へ追記する'));
  console.log('');
}
if (gapDataSide.length) {
  console.log('[!] トレーニングログ.csv にはあるが data.js の log[] に無い回（アプリへの反映漏れ）');
  gapDataSide.forEach((d) => console.log('    - ' + d + '   → publish-kintore の手順で data.js へ反映する'));
  console.log('');
}
if (dataProblems.length) {
  console.log('[!] data.js の内部不整合（publish-kintore の手作業ミスの疑い）');
  dataProblems.forEach((p) => console.log('    - ' + p));
  console.log('');
}
console.log('要対応: ' + totalGaps + ' 件。上記を解消してから公開してください。');
process.exit(1);
