import "server-only";
import opentype from "opentype.js";
import sharp from "sharp";
import { LEBAR_DOT, geometriLogo, LOGO_GAP, bersihkan } from "./format";
import fontBoldJson from "./fonts/bold.json";
import fontRegularJson from "./fonts/regular.json";
import { ikonTelepon } from "./ikon";
import type { LebarKertas, LogoBitmap } from "./types";

/**
 * Font disertakan di repo (Liberation Sans, metrik sama dengan Arial, lisensi OFL) dan teks
 * diubah menjadi outline (path SVG) lewat opentype.js sebelum dirender sharp. Dengan begitu
 * hasil raster identik di Windows, Docker, maupun Vercel tanpa font sistem.
 */
function muatFont(j: { data: string }): opentype.Font {
  const buf = Buffer.from(j.data, "base64");
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
let fontRegular: opentype.Font | null = null;
let fontBold: opentype.Font | null = null;
function font(bold: boolean): opentype.Font {
  if (bold) return (fontBold ??= muatFont(fontBoldJson));
  return (fontRegular ??= muatFont(fontRegularJson));
}

/** Bitmap 1 byte per pixel: 1 = hitam. */
export interface Mono {
  width: number;
  height: number;
  px: Uint8Array;
}

/** Raster siap kirim: bit 1bpp per baris (MSB kiri), sama seperti LogoBitmap. */
export interface HeaderRaster {
  width: number;
  height: number;
  bytesPerRow: number;
  data: Buffer;
}

export interface HeaderSpec {
  logos: LogoBitmap[];
  subJudul: string;
  infoTol: string;
  ikonTelepon: boolean;
  lebar: LebarKertas;
}

function monoKosong(width: number, height: number): Mono {
  return { width, height, px: new Uint8Array(width * height) };
}

function blit(dst: Mono, src: Mono, x0: number, y0: number) {
  for (let y = 0; y < src.height; y++) {
    const dy = y0 + y;
    if (dy < 0 || dy >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      if (!src.px[y * src.width + x]) continue;
      const dx = x0 + x;
      if (dx < 0 || dx >= dst.width) continue;
      dst.px[dy * dst.width + dx] = 1;
    }
  }
}

function logoKeMono(l: LogoBitmap): Mono {
  const buf = Buffer.from(l.data, "base64");
  const m = monoKosong(l.width, l.height);
  for (let y = 0; y < l.height; y++)
    for (let x = 0; x < l.width; x++)
      m.px[y * l.width + x] = (buf[y * l.bytesPerRow + (x >> 3)] >> (7 - (x & 7))) & 1;
  return m;
}

function ikonKeMono(lebar: LebarKertas): Mono {
  const rows = ikonTelepon(lebar);
  const m = monoKosong(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === "X") m.px[y * m.width + x] = 1;
  });
  return m;
}

/**
 * Render teks jadi bitmap hitam-putih: glyph -> path SVG (opentype.js, font di repo) -> sharp,
 * dipangkas ke batas tinta. Tidak memakai font sistem sama sekali.
 */
export async function teksMono(
  text: string,
  opts: { size: number; bold?: boolean; letterSpacing?: number },
): Promise<Mono> {
  const t = bersihkan(text);
  if (!t.trim()) return monoKosong(1, Math.ceil(opts.size * 1.3));
  const f = font(Boolean(opts.bold));
  const ls = opts.letterSpacing ?? 0;
  const size = opts.size;
  const skala = size / f.unitsPerEm;
  // susun path per glyph agar letter-spacing bisa diatur
  let x = 4;
  const baseline = Math.round(size * 1.02);
  const paths: string[] = [];
  const glyphs = f.stringToGlyphs(t);
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const p = g.getPath(x, baseline, size);
    const d = p.toPathData(2);
    if (d) paths.push(d);
    const adv = (g.advanceWidth ?? 0) * skala;
    const kern = i + 1 < glyphs.length ? f.getKerningValue(g, glyphs[i + 1]) * skala : 0;
    x += adv + kern + ls;
  }
  const h = Math.ceil(size * 1.35);
  const w = Math.ceil(x) + 8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="${paths.join(" ")}" fill="#000"/></svg>`;
  const { data, info } = await sharp(Buffer.from(svg))
    .flatten({ background: "#fff" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = new Uint8Array(info.width * info.height);
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] < 140) {
        px[y * info.width + x] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  if (maxX < 0) return monoKosong(1, 1);
  // pangkas ke batas tinta di keempat sisi supaya jarak antar elemen bisa diatur presisi
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const out = monoKosong(cw, ch);
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) out.px[y * cw + x] = px[(minY + y) * info.width + minX + x];
  return out;
}

/** Perkecil ukuran font sampai lebar teks muat di maxWidth. */
async function teksMuat(
  text: string,
  size: number,
  bold: boolean,
  maxWidth: number,
  letterSpacing = 0,
): Promise<Mono> {
  let s = size;
  for (;;) {
    const m = await teksMono(text, { size: s, bold, letterSpacing });
    if (m.width <= maxWidth || s <= 8) return m;
    s -= 1;
  }
}

/**
 * Kepala struk sebagai satu gambar (lebar penuh area cetak):
 *   [logo-logo, rata tengah]
 *   sub-judul (tebal kecil) rata kiri di bawah wordmark logo pertama
 *   Info Tol : (ikon) 14080   rata tengah
 */
export async function buildHeaderMono(spec: HeaderSpec): Promise<Mono> {
  const W = LEBAR_DOT[spec.lebar];
  // template 80mm: semua elemen kepala 1,5x (logo sudah varian "-80" dari pemanggil)
  const skala = spec.lebar === 80 ? 1.5 : 1;
  const logos = spec.logos.map(logoKeMono);
  const { kiri } = geometriLogo(spec.logos, spec.lebar);
  const logoH = logos.length ? Math.max(...logos.map((l) => l.height)) : 0;

  // Sub-judul menempel di bawah wordmark, rata kiri dengan awal wordmark (huruf J pada JASAMARGA).
  // Bila logo punya wordmark, lebar teks dibatasi selebar wordmark seperti tagline asli.
  const logo0 = spec.logos[0];
  const wordmarkX = logo0?.wordmarkX ?? 0;
  const anchorX = logo0 ? kiri + wordmarkX : 0;
  const lebarWordmark = logo0 && wordmarkX > 0 ? logo0.width - wordmarkX : 0;
  const maxSub = lebarWordmark > 0 ? Math.round(lebarWordmark * 1.08) : W - anchorX - 4;
  // di struk asli ("TRANSJAWA TOL") bobot normal dengan jarak huruf lebar
  const sub = spec.subJudul.trim()
    ? await teksMuat(spec.subJudul.trim(), Math.round(13 * skala), false, maxSub, 1.5 * skala)
    : null;

  let info: Mono | null = null;
  if (spec.infoTol.trim()) {
    // di foto asli baris ini tebal
    const ukuran = Math.round(16 * skala);
    const kiriTeks = await teksMono("Info Tol :", { size: ukuran, bold: true });
    const kananTeks = await teksMono(spec.infoTol.trim(), { size: ukuran, bold: true });
    const ikon = spec.ikonTelepon ? ikonKeMono(spec.lebar) : null;
    const sela = Math.round(6 * skala);
    const w = kiriTeks.width + sela + (ikon ? ikon.width + sela : 0) + kananTeks.width;
    const h = Math.max(kiriTeks.height, kananTeks.height, ikon?.height ?? 0);
    info = monoKosong(w, h);
    // semua bagian diratakan ke garis dasar (bawah)
    let x = 0;
    blit(info, kiriTeks, x, h - kiriTeks.height);
    x += kiriTeks.width + sela;
    if (ikon) {
      blit(info, ikon, x, h - ikon.height);
      x += ikon.width + sela;
    }
    blit(info, kananTeks, x, h - kananTeks.height);
  }

  // Tinggi kanvas dilebihkan dulu, dipangkas di akhir.
  const selaLogoSub = Math.round(3 * skala);
  const selaSubInfo = Math.round(4 * skala);
  const out = monoKosong(W, logoH + (sub?.height ?? 0) + (info?.height ?? 0) + 24);

  let x = kiri;
  for (const l of logos) {
    blit(out, l, x, Math.floor((logoH - l.height) / 2));
    x += l.width + LOGO_GAP;
  }

  // Bila ada wordmark: sub-judul & Info Tol disusun di "kolom wordmark" (kanan simbol),
  // seperti foto asli: simbol menjulur ke bawah sampai sejajar baris Info Tol.
  const adaWordmark = lebarWordmark > 0;
  const kolomX0 = adaWordmark ? anchorX : 0;
  const kolomX1 = adaWordmark ? anchorX + lebarWordmark : W;
  const barisTintaTerakhir = (x0: number, x1: number, sampaiY: number) => {
    for (let yy = sampaiY - 1; yy >= 0; yy--)
      for (let xx = x0; xx < x1; xx++) if (out.px[yy * W + xx]) return yy;
    return -1;
  };
  let yBawah = barisTintaTerakhir(kolomX0, Math.min(W, kolomX1 + 8), logoH) + 1;
  if (yBawah <= 0) yBawah = logoH;

  if (sub) {
    const y = yBawah + selaLogoSub;
    blit(out, sub, Math.min(anchorX, W - sub.width), y);
    yBawah = y + sub.height;
  }
  if (info) {
    const y = yBawah + selaSubInfo;
    const tengah = adaWordmark
      ? Math.round((kolomX0 + kolomX1) / 2 - info.width / 2)
      : Math.floor((W - info.width) / 2);
    blit(out, info, Math.max(0, Math.min(W - info.width, tengah)), y);
    yBawah = y + info.height;
  }

  const H = Math.max(logoH, yBawah) + 2;
  return { width: W, height: H, px: out.px.subarray(0, W * H) };
}

export function monoKeRaster(m: Mono): HeaderRaster {
  const bytesPerRow = Math.ceil(m.width / 8);
  const data = Buffer.alloc(bytesPerRow * m.height, 0);
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++)
      if (m.px[y * m.width + x]) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
  return { width: m.width, height: m.height, bytesPerRow, data };
}

export async function monoKePng(m: Mono): Promise<Buffer> {
  const raw = Buffer.alloc(m.width * m.height);
  for (let i = 0; i < raw.length; i++) raw[i] = m.px[i] ? 0 : 255;
  return sharp(raw, { raw: { width: m.width, height: m.height, channels: 1 } }).png().toBuffer();
}

export async function buildHeaderRaster(spec: HeaderSpec): Promise<HeaderRaster> {
  return monoKeRaster(await buildHeaderMono(spec));
}
