/* ホーム画面アプリ（PWA）用のPNGアイコンを生成する。
   ★なぜPNGか：Android（Chrome/Vivaldi等）は、ホーム画面に「アプリ（WebAPK）」として
     登録するときアイコンにPNG画像（192px・512px）を要求する。SVGだと「ショートカット」扱いに
     なり、アイコン右下にブラウザのバッジが付いてしまう。だからPNGを用意する。
   ★外部ライブラリ不要：Node内蔵の zlib だけでPNGを書き出す（壊れにくく、1人で長く保てる）。
   デザイン：クリーム地（Claude配色）＋コーラルの「逆三角形の体」シルエット
     （頭・首・広い肩から細い腰へ）。icon-card.svg と同じ図形。 */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const ROOT = __dirname;

const CREAM = [0xED, 0xE7, 0xDA]; // 背景（角まで塗る＝maskable対応）
const CORAL = [0xCC, 0x78, 0x5C]; // 体のシルエット（Claudeのコーラル）

// 体の各パーツは 192四方を基準に定義（icon-card.svg と一致させる）。
const HEAD = { cx: 96, cy: 46, r: 17 };
const NECK = { x: 87, y: 58, w: 18, h: 16 };

// 胴体は曲線（2次ベジェ）なので、線分に分解して多角形にしてから内外判定する。
function quad(p0, c, p1, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
          u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}
function buildTorso() {
  const pts = [], N = 28;
  for (let i = 0; i <= N; i++) pts.push(quad([50, 80], [96, 66], [142, 80], i / N)); // 肩の上辺
  pts.push([118, 152]);                                                              // 右脇腹→腰
  for (let i = 1; i <= N; i++) pts.push(quad([118, 152], [96, 158], [74, 152], i / N)); // 腰の下辺
  return pts; // 左脇腹は最後の点→始点の直線で閉じる
}
const TORSO = buildTorso();

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
// 点(px,py)が体（コーラル）の内側か：頭の円・首の長方形・胴体の多角形のどれか
function isMark(px, py) {
  const dx = px - HEAD.cx, dy = py - HEAD.cy;
  if (dx * dx + dy * dy <= HEAD.r * HEAD.r) return true;
  if (px >= NECK.x && px <= NECK.x + NECK.w && py >= NECK.y && py <= NECK.y + NECK.h) return true;
  return inPoly(px, py, TORSO);
}

// size四方のRGBAバッファ。SS倍でスーパーサンプリングして輪郭をなめらかに。
function render(size) {
  const SS = 4, scale = (size * SS) / 192;
  const out = Buffer.alloc(size * size * 4);
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const px = (ox * SS + sx + 0.5) / scale;
        const py = (oy * SS + sy + 0.5) / scale;
        const col = isMark(px, py) ? CORAL : CREAM;
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
  ihdr[8] = 8; ihdr[9] = 6; // 8bit / RGBA
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
