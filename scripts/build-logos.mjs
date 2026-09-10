// Konversi logo operator (public/logos/*.svg|png) menjadi bitmap 1-bit untuk ESC/POS.
// Hasil: lib/struk/logos/<id>.json  { id, width, height, bytesPerRow, data(base64) }
// Juga menulis pratinjau PNG hitam-putih ke lib/struk/logos/preview/<id>.png untuk dicek mata.
// Jalankan: npm run logos:build   (butuh devDependency sharp)
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "logos");
const OUT = path.join(ROOT, "lib", "struk", "logos");
// PNG hitam-putih hasil konversi: dipakai pratinjau browser supaya sama persis dengan cetakan
const PREVIEW = path.join(SRC, "mono");
mkdirSync(OUT, { recursive: true });
mkdirSync(PREVIEW, { recursive: true });

/**
 * Daftar logo: id -> { file, width (dot), lumThreshold, cropGap }.
 * Lebar cetak struk 384 dot.
 * - lumThreshold: pixel hitam bila luminance < nilai ini (default 235 = semua warna kecuali putih).
 *   Jasa Marga pakai 150 supaya lengkung kuning tetap putih seperti di struk asli.
 * - cropGap: buang bagian bawah logo mulai dari celah kosong terakhir (menghapus tagline
 *   "Indonesia Highway Corp." yang di struk dicetak sebagai baris teks terpisah).
 */
/**
 * Sumber Jasa Marga = foto lockup struk asli (public/logos/logo struk tol jasa marga.jpg, 736x736):
 *   simbol x123-238 y293-408; wordmark y301-345; tagline "Indonesia Highway Corporation" y355-371;
 *   baris "Info Tol : (ikon) 14080" y374-411, ikon x425-461.
 * `crop` = potongan sumber (px), `erase` = kotak yang diputihkan (px relatif ke crop) sebelum di-resize.
 */
const JM_SRC = "logo struk tol jasa marga.jpg";
const JM_CROP = { left: 123, top: 293, width: 464, height: 116 };
/** Template 80mm memakai versi 1,5x (id + "-80") supaya proporsinya sama di kertas lebih lebar. */
const SKALA_80 = 1.5;
const LOGOS_DASAR = [
  // simbol + wordmark saja (tagline & Info Tol diputihkan) -> dipakai JTT, Kunciran, dst.
  {
    id: "jasamarga",
    file: JM_SRC,
    crop: JM_CROP,
    erase: [{ left: 132, top: 57, width: 332, height: 59 }],
    width: 230,
    lumThreshold: 150,
    wordmark: true,
  },
  // simbol + wordmark + tagline asli "Indonesia Highway Corporation" -> operator Jasa Marga IHC
  {
    id: "jasamarga-ihc",
    file: JM_SRC,
    crop: JM_CROP,
    erase: [{ left: 132, top: 80, width: 332, height: 36 }],
    width: 230,
    lumThreshold: 150,
    wordmark: true,
  },
  // ikon telepon-lingkaran dari foto yang sama, diperkecil ke 19 dot
  {
    id: "ikon-telepon",
    file: JM_SRC,
    crop: { left: 424, top: 373, width: 39, height: 39 },
    width: 19,
    lumThreshold: 150,
  },
  { id: "hutamakarya", file: "hutamakarya.svg", width: 110 },
  { id: "transsumatera", file: "transsumatera.svg", width: 150, optional: true },
  { id: "waskita", file: "waskita.svg", width: 100, wordmark: false },
];
const LOGOS = LOGOS_DASAR.flatMap((l) => [
  l,
  { ...l, id: `${l.id}-80`, width: Math.round(l.width * SKALA_80) },
]);

/**
 * Posisi x (dot) awal wordmark: kolom pertama yang berisi setelah celah kosong pertama
 * di sebelah kanan simbol. Dipakai untuk meratakan sub-judul di bawah wordmark.
 */
function cariWordmarkX(w, h, mono) {
  const isi = (x) => {
    for (let y = 0; y < h; y++) if (mono[y * w + x] === 0) return true;
    return false;
  };
  let x = 0;
  while (x < w && !isi(x)) x++; // lewati margin kiri
  while (x < w && isi(x)) x++; // lewati simbol
  while (x < w && !isi(x)) x++; // lewati celah
  return x < w ? x : 0;
}

const DENSITY = 300; // rasterisasi SVG tajam sebelum di-resize

/**
 * Hapus tagline di bawah wordmark: cari celah kosong terakhir (hanya dilihat pada kolom
 * di sebelah kanan simbol, x >= 30% lebar) yang berada di bawah 50% tinggi, lalu putihkan
 * semua pixel di bawah celah itu pada kolom tersebut. Simbol di kiri tetap utuh, lalu
 * baris kosong di bawah dipangkas.
 */
function cropAtLastGap(w, h, mono) {
  const x0 = Math.floor(w * 0.3);
  const blank = [];
  for (let y = 0; y < h; y++) {
    let ada = false;
    for (let x = x0; x < w; x++) if (mono[y * w + x] === 0) { ada = true; break; }
    blank.push(!ada);
  }
  // celah = transisi isi->kosong; ambil yang terakhir tapi masih punya isi di bawahnya (tagline)
  let cut = -1;
  for (let y = Math.floor(h * 0.5); y < h; y++) {
    if (blank[y] && !blank[y - 1]) {
      let adaIsiDiBawah = false;
      for (let yy = y + 1; yy < h; yy++) if (!blank[yy]) { adaIsiDiBawah = true; break; }
      if (adaIsiDiBawah) cut = y;
    }
  }
  if (cut < 0) return { w, h, mono };
  for (let y = cut; y < h; y++) for (let x = x0; x < w; x++) mono[y * w + x] = 255;
  let bottom = h;
  while (bottom > 1) {
    let ada = false;
    for (let x = 0; x < w; x++) if (mono[(bottom - 1) * w + x] === 0) { ada = true; break; }
    if (ada) break;
    bottom--;
  }
  return { w, h: bottom, mono: mono.subarray(0, w * bottom) };
}

function packBits(w, h, mono) {
  const bytesPerRow = Math.ceil(w / 8);
  const bits = Buffer.alloc(bytesPerRow * h, 0);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mono[y * w + x] === 0) bits[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
  return { bytesPerRow, bits };
}

async function toMono(file, width, lumThreshold = 235, cropGap = false, crop = null, erase = []) {
  const input = readFileSync(file);
  let img = sharp(input, { density: DENSITY });
  if (crop) img = img.extract(crop);
  if (erase.length) {
    img = img.composite(
      erase.map((r) => ({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${r.width}" height="${r.height}"><rect width="100%" height="100%" fill="#fff"/></svg>`,
        ),
        left: r.left,
        top: r.top,
      })),
    );
    // composite lalu resize butuh dua tahap di sharp
    img = sharp(await img.png().toBuffer());
  }
  const { data, info } = await img
    .resize({ width, fit: "inside", kernel: "lanczos3" })
    .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w0, height: h0, channels } = info;
  let mono = Buffer.alloc(w0 * h0, 255);
  for (let y = 0; y < h0; y++) {
    for (let x = 0; x < w0; x++) {
      const i = (y * w0 + x) * channels;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = channels > 3 ? data[i + 3] : 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // hitam bila terlihat (alpha) dan lebih gelap dari ambang
      if (a > 127 && lum < lumThreshold) mono[y * w0 + x] = 0;
    }
  }
  let w = w0, h = h0;
  if (cropGap) ({ w, h, mono } = cropAtLastGap(w0, h0, mono));
  const { bytesPerRow, bits } = packBits(w, h, mono);
  return { w, h, bytesPerRow, bits, mono };
}

for (const logo of LOGOS) {
  const file = path.join(SRC, logo.file);
  if (!existsSync(file)) {
    if (logo.optional) {
      console.log(`lewati ${logo.id}: ${logo.file} tidak ada`);
      continue;
    }
    throw new Error(`file logo tidak ada: ${file}`);
  }
  const { w, h, bytesPerRow, bits, mono } = await toMono(
    file,
    logo.width,
    logo.lumThreshold,
    logo.cropGap,
    logo.crop ?? null,
    logo.erase ?? [],
  );
  const wordmarkX = logo.wordmark ? cariWordmarkX(w, h, mono) : 0;
  const json = { id: logo.id, width: w, height: h, bytesPerRow, wordmarkX, data: bits.toString("base64") };
  writeFileSync(path.join(OUT, `${logo.id}.json`), JSON.stringify(json));
  await sharp(mono, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toFile(path.join(PREVIEW, `${logo.id}.png`));
  console.log(`${logo.id}: ${w}x${h} dot, ${bits.length} byte, wordmarkX=${wordmarkX}`);
}
