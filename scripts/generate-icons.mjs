// One-off generator for the PWA icon set (no image deps available in this env).
// Draws the same "Cap" glyph as the design mockup: an upward zigzag line
// with an arrow-flag corner, on a sage gradient, encoded as raw PNGs.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// distance from point (px,py) to segment (ax,ay)-(bx,by)
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size, { padding = 0.14 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const top = [0x64, 0xa8, 0x82];    // sage light
  const bottom = [0x3c, 0x77, 0x59]; // sage dark
  const S = 1 - padding * 2;

  // zigzag: P0->P1->P2->P3, plus flag corner F0->F1->F2 (matches mockup path)
  const pts = [
    [0.22, 0.62], [0.42, 0.42], [0.58, 0.50], [0.78, 0.26],
  ].map(([x, y]) => [padding + x * S, padding + y * S]);
  const flag = [
    [0.66, 0.26], [0.82, 0.26], [0.82, 0.44],
  ].map(([x, y]) => [padding + x * S, padding + y * S]);
  const segs = [
    [pts[0], pts[1]], [pts[1], pts[2]], [pts[2], pts[3]],
    [flag[0], flag[1]], [flag[1], flag[2]],
  ];
  const thickness = size * 0.052;

  const SS = 2; // supersample factor
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, samples = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const t = py / size;
          let cr = lerp(top[0], bottom[0], t);
          let cg = lerp(top[1], bottom[1], t);
          let cb = lerp(top[2], bottom[2], t);
          const nx = px / size, ny = py / size;
          for (const [[ax, ay], [bx, by]] of segs) {
            if (distToSeg(nx, ny, ax, ay, bx, by) < thickness / size / 2) {
              cr = 255; cg = 255; cb = 255;
              break;
            }
          }
          r += cr; g += cg; b += cb; samples++;
        }
      }
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / samples);
      rgba[i + 1] = Math.round(g / samples);
      rgba[i + 2] = Math.round(b / samples);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

mkdirSync(new URL('../public/icons', import.meta.url), { recursive: true });
for (const size of [512, 192, 180, 32]) {
  const rgba = drawIcon(size, { padding: size === 512 ? 0.18 : 0.14 });
  const png = encodePNG(size, size, rgba);
  writeFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url), png);
  console.log(`wrote icon-${size}.png`);
}
