/* ホーム画面アプリ（PWA）用のPNGアイコンを生成する。
   ★なぜPNGか：Android（Chrome/Vivaldi等）は、ホーム画面に「アプリ（WebAPK）」として
     登録するときアイコンにPNG画像（192px・512px）を要求する。SVGだと「ショートカット」扱いに
     なり、アイコン右下にブラウザのバッジが付いてしまう。だからPNGを用意する。
   ★外部ライブラリ不要：Node内蔵の zlib だけでPNGを書き出す（壊れにくく、1人で長く保てる）。
   デザインは icon-card.svg と同じ：オックスブラッド地（フルブリード）＋紙色のダンベル。
   使い方: node gen-icons.cjs  → icon-card-192.png / icon-card-512.png を生成。 */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const ROOT = __dirname;

const OX    = [0x7C, 0x2A, 0x22]; // オックスブラッド＝背景（角まで塗る＝maskable対応）
const PAPER = [0xF4, 0xEF, 0xE6]; // 紙色＝ダンベル

// ダンベルの各パーツ。192四方を基準にした [x, y, 幅, 高さ, 角丸半径]。
// 中心80%の「安全領域」に収め、丸く切り抜かれても欠けないようにしている。
const PARTS_192 = [
  [56, 89, 80, 14, 7],  // バー（持ち手）
  [44, 68, 16, 56, 5],  // 内プレート左
  [132, 68, 16, 56, 5], // 内プレート右
  [26, 78, 14, 36, 5],  // 外プレート左
  [152, 78, 14, 36, 5], // 外プレート右
];

// 点(px,py)が角丸長方形の内側にあるか
function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// size四方のRGBAバッファを作る。SS倍でスーパーサンプリングして輪郭をなめらかに。
function render(size) {
  const SS = 4, scale = (size * SS) / 192;
  const out = Buffer.alloc(size * size * 4);
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = (ox * SS + sx + 0.5) / scale;
        const py = (oy * SS + sy + 0.5) / scale;
        let col = OX;
        for (const [x, y, w, h, rad] of PARTS_192) {
          if (inRoundRect(px, py, x, y, w, h, rad)) { col = PAPER; break; }
        }
        r += col[0]; g += col[1]; b += col[2];
      }
      const n = SS * SS, i = (oy * size + ox) * 4;
      out[i] = Math.round(r / n); out[i + 1] = Math.round(g / n);
      out[i + 2] = Math.round(b / n); out[i + 3] = 255;
    }
  }
  return out;
}

// CRC32（PNGの各チャンクに必要）
const CRCT = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRCT[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function writePNG(file, size, rgba) {
  const stride = size * 4;
  // 各行の先頭にフィルタ種別0を付けた生データ
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit / RGBA(truecolor+alpha)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(file, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
}

function generate() {
  for (const sz of [192, 512]) {
    writePNG(path.join(ROOT, `icon-card-${sz}.png`), sz, render(sz));
    console.log(`icon-card-${sz}.png 生成`);
  }
}

module.exports = { generate };
if (require.main === module) generate();
