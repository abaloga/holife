/**
 * Generates the PWA icon set from code so the marks stay in sync with the brand
 * colours and can be regenerated after a rename.
 *
 *   node scripts/generate-icons.mjs
 *
 * The mark is a typographic "H" with the accent dot from the wordmark, drawn
 * directly into an RGBA buffer and encoded as PNG with zlib, with no image
 * dependencies, nothing binary checked in that cannot be rebuilt.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(here, '../public/icons');

const INK = [10, 10, 11, 255];
const PAPER = [250, 250, 250, 255];
const ACCENT = [217, 87, 35, 255];

/* -------------------------------------------------------------------------- */
/* PNG encoding                                                                */
/* -------------------------------------------------------------------------- */

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                     */
/* -------------------------------------------------------------------------- */

function createCanvas(size) {
  return { size, pixels: Buffer.alloc(size * size * 4) };
}

/** Alpha-composites a colour over one pixel; `coverage` gives antialiasing. */
function blend(canvas, x, y, colour, coverage = 1) {
  if (x < 0 || y < 0 || x >= canvas.size || y >= canvas.size || coverage <= 0) return;
  const index = (y * canvas.size + x) * 4;
  const alpha = (colour[3] / 255) * Math.min(coverage, 1);
  for (let channel = 0; channel < 3; channel += 1) {
    canvas.pixels[index + channel] = Math.round(
      colour[channel] * alpha + canvas.pixels[index + channel] * (1 - alpha),
    );
  }
  canvas.pixels[index + 3] = Math.round(255 * alpha + canvas.pixels[index + 3] * (1 - alpha));
}

/** A rounded rectangle, sampled 3×3 per pixel so the corners are not jagged. */
function roundedRect(canvas, x0, y0, width, height, radius, colour) {
  const x1 = x0 + width;
  const y1 = y0 + height;
  const samples = 3;

  const inside = (px, py) => {
    if (px < x0 || px > x1 || py < y0 || py > y1) return false;
    const cx = Math.min(Math.max(px, x0 + radius), x1 - radius);
    const cy = Math.min(Math.max(py, y0 + radius), y1 - radius);
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius || (px >= x0 + radius && px <= x1 - radius) ||
      (py >= y0 + radius && py <= y1 - radius);
  };

  for (let y = Math.floor(y0); y < Math.ceil(y1); y += 1) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x += 1) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          if (inside(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples)) hits += 1;
        }
      }
      blend(canvas, x, y, colour, hits / (samples * samples));
    }
  }
}

function circle(canvas, cx, cy, radius, colour) {
  const samples = 3;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      let hits = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples - cx;
          const py = y + (sy + 0.5) / samples - cy;
          if (px * px + py * py <= radius * radius) hits += 1;
        }
      }
      blend(canvas, x, y, colour, hits / (samples * samples));
    }
  }
}

/**
 * @param {number} size
 * @param {{ maskable?: boolean }} options `maskable` shrinks the mark into the
 *   safe zone so Android's circular mask cannot clip it.
 */
function drawIcon(size, { maskable = false } = {}) {
  const canvas = createCanvas(size);
  const unit = size / 100;

  // Background: full bleed, with the platform rounding it as it sees fit.
  roundedRect(canvas, 0, 0, size, size, maskable ? 0 : 22 * unit, INK);

  // The mark sits in a 56% box for maskable icons, 62% otherwise.
  const markWidth = size * (maskable ? 0.4 : 0.46);
  const markHeight = size * (maskable ? 0.44 : 0.5);
  const left = (size - markWidth) / 2;
  const top = (size - markHeight) / 2;

  const stem = markWidth * 0.26;
  const bar = markHeight * 0.2;
  const radius = stem * 0.28;

  // Two stems and a crossbar: an "H" built from the same geometry as the UI.
  roundedRect(canvas, left, top, stem, markHeight, radius, PAPER);
  roundedRect(canvas, left + markWidth - stem, top, stem, markHeight, radius, PAPER);
  roundedRect(
    canvas,
    left + stem - radius * 0.5,
    top + (markHeight - bar) / 2,
    markWidth - stem * 2 + radius,
    bar,
    radius * 0.6,
    PAPER,
  );

  // The accent dot from the wordmark, on the baseline to the right.
  const dotRadius = markWidth * 0.085;
  circle(
    canvas,
    left + markWidth + dotRadius * (maskable ? 1.4 : 1.8),
    top + markHeight - dotRadius,
    dotRadius,
    ACCENT,
  );

  return encodePng(size, size, canvas.pixels);
}

function svgIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="HoLife">
  <rect width="100" height="100" rx="22" fill="#0a0a0b"/>
  <g fill="#fafafa">
    <rect x="27" y="25" width="12" height="50" rx="3.4"/>
    <rect x="61" y="25" width="12" height="50" rx="3.4"/>
    <rect x="37" y="45" width="26" height="10" rx="2"/>
  </g>
  <circle cx="80" cy="71" r="4" fill="#d95723"/>
</svg>
`;
}

mkdirSync(outputDir, { recursive: true });

const files = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  ['maskable-512.png', drawIcon(512, { maskable: true })],
  ['apple-touch-icon.png', drawIcon(180)],
  ['icon.svg', Buffer.from(svgIcon(), 'utf8')],
];

for (const [name, data] of files) {
  writeFileSync(resolve(outputDir, name), data);
  console.log(`wrote public/icons/${name} (${data.length} bytes)`);
}
