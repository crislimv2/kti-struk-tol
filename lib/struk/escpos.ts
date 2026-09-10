import { LEBAR_DOT, isiBaris, kolom, potong } from "./format";
import type { LebarKertas, StrukLine } from "./types";

const ESC = 0x1b;
const GS = 0x1d;

/**
 * Posisi blok struk di kertas 80mm dalam kolom karakter, 0 = rapat kiri (keputusan owner).
 * Perataan dilakukan dengan spasi, bukan GS L / ESC a, karena printer XS-80BT
 * mengabaikan ESC a tepat setelah raster dan mencetak parameter GS W sebagai huruf.
 */
export const POSISI_KIRI_DOT = 0;
/** 1 "baris" feed akhir = 30 dot (jarak baris bawaan printer) */
export const FEED_DOT_PER_BARIS = 30;
/** padding akhir default: 4 baris = 120 dot = ~15mm, untuk 58mm maupun 80mm */
export const FEED_BARIS_DEFAULT = 4;
/** sela antara raster kepala dan nama gerbang (dot) */
export const GAP_SETELAH_HEADER_DOT = 8;
/** jarak baris maksimum per LF yang masih dijalankan XS-80BT */
const FEED_MAKS_PER_LF = 40;

/** Raster 1bpp siap kirim (kepala struk: logo + sub-judul + Info Tol). */
export interface RasterInput {
  width: number;
  height: number;
  bytesPerRow: number;
  data: Uint8Array;
}

export interface EscPosOptions {
  lebar?: LebarKertas;
  /** feed baris sebelum potong; padding bawah struk asli ~3 baris */
  feed?: number;
  cut?: boolean;
  /** jarak antar baris dalam dot (ESC 3 n); Font B 17 dot + sela */
  lineSpacing?: number;
}

function ascii(s: string): number[] {
  const out: number[] = [];
  const t = s.replace(/[^\x20-\x7E]/g, "?");
  for (let i = 0; i < t.length; i++) out.push(t.charCodeAt(i));
  return out;
}

/** GS v 0: raster selebar area cetak. Terbukti didukung XS-80BT (logo tercetak bersih). */
function rasterGsV0(r: RasterInput): number[] {
  return [
    GS, 0x76, 0x30, 0x00,
    r.bytesPerRow & 0xff, (r.bytesPerRow >> 8) & 0xff,
    r.height & 0xff, (r.height >> 8) & 0xff,
    ...r.data,
  ];
}

/**
 * Raster "kosong" setinggi n dot untuk memajukan kertas sebelum potong. Raster yang
 * seluruhnya putih dilompati XS-80BT tanpa feed, jadi diberi satu titik (1 dot = 0,125mm,
 * praktis tak terlihat) di pojok kiri bawah agar printer benar-benar mencetak sampai baris akhir.
 */
function rasterKosong(tinggiDot: number, lebarDot: number): number[] {
  const h = Math.max(0, Math.round(tinggiDot));
  if (h === 0) return [];
  const bytesPerRow = Math.ceil(lebarDot / 8);
  const data = new Uint8Array(bytesPerRow * h);
  data[(h - 1) * bytesPerRow] = 0x80;
  return rasterGsV0({ width: lebarDot, height: h, bytesPerRow, data });
}

/** Baris yang sudah termasuk di raster kepala: sub-judul (indentDot) dan Info Tol (ikonTelepon). */
export function barisDiRaster(line: StrukLine): boolean {
  return Boolean(line.indentDot || line.ikonTelepon);
}

/** Teks baris siap cetak, sudah termasuk spasi perataan (tengah / blok 58mm). */
export function teksBaris(line: StrukLine, lebar: LebarKertas): string {
  const w = kolom(line.font, lebar);
  if (line.kosong) return "";
  if (line.kanan || line.blok) return isiBaris(line, lebar);
  if (line.align === "tengah") {
    const t = potong(line.text.trim(), w);
    return " ".repeat(Math.floor((w - t.length) / 2)) + t;
  }
  return potong(line.text, w);
}

/**
 * Feed sejumlah dot memakai LF dengan jarak baris sementara (ESC 3 n + LF), lalu jarak
 * baris dikembalikan. XS-80BT mengabaikan ESC J, tetapi ESC 3 + LF terbukti bekerja.
 */
function feedDot(totalDot: number, spacingKembali: number): number[] {
  const out: number[] = [];
  let sisa = Math.max(0, Math.round(totalDot));
  while (sisa > 0) {
    // XS-80BT mengabaikan ESC 3 dengan nilai besar (120 tidak jalan, 36 jalan):
    // pecah jadi beberapa LF dengan jarak baris <= 40 dot
    const n = Math.min(FEED_MAKS_PER_LF, sisa);
    out.push(ESC, 0x33, n, 0x0a);
    sisa -= n;
  }
  out.push(ESC, 0x33, spacingKembali);
  return out;
}

function barisTeks(line: StrukLine, lebar: LebarKertas, spacing: number): number[] {
  const out: number[] = [];
  if (line.kosong && line.tinggiDot) return feedDot(line.tinggiDot, spacing);
  out.push(ESC, 0x4d, line.font === "A" ? 0x00 : 0x01); // ESC M font
  out.push(ESC, 0x45, line.bold ? 0x01 : 0x00); // ESC E bold
  out.push(GS, 0x21, line.tinggiGanda ? 0x01 : 0x00); // GS ! tinggi ganda
  out.push(...ascii(teksBaris(line, lebar)), 0x0a);
  return out;
}

/**
 * Bangun byte ESC/POS: kepala struk sebagai raster GS v 0, lalu teks dengan font bawaan
 * printer per baris (perataan dengan spasi), feed pendek, partial cut.
 * Sengaja tanpa GS L / GS W / ESC a / ESC * / Font B tebal: tidak andal di XS-80BT.
 */
export function buildStrukEscPos(
  lines: StrukLine[],
  header: RasterInput | null,
  opts: EscPosOptions = {},
): Uint8Array {
  const lebar: LebarKertas = opts.lebar === 80 ? 80 : 58;
  // padding akhir ~15mm (setara jarak head-ke-pisau yang jadi margin atas) agar atas-bawah seimbang
  const feed = Math.max(0, Math.min(opts.feed ?? FEED_BARIS_DEFAULT, 40));
  const cut = opts.cut ?? true;
  const spacing = Math.max(0, Math.min(opts.lineSpacing ?? 22, 255));

  const out: number[] = [];
  out.push(ESC, 0x40); // init
  out.push(ESC, 0x74, 0x00); // code page PC437
  out.push(ESC, 0x33, spacing); // ESC 3 jarak baris

  if (header && header.height > 0) {
    out.push(...rasterGsV0(header));
    out.push(...feedDot(GAP_SETELAH_HEADER_DOT, spacing)); // flush raster + sela kecil sebelum nama gerbang
  }
  for (const line of lines) {
    if (barisDiRaster(line)) continue;
    out.push(...barisTeks(line, lebar, spacing));
  }

  out.push(GS, 0x21, 0x00, ESC, 0x45, 0x00, ESC, 0x4d, 0x00);
  // Padding bawah SEBELUM potong. Di XS-80BT feed (LF) hanya benar-benar dijalankan bila
  // sesudahnya ada konten yang dicetak (jarak di bawah gerbang jalan, feed sebelum potong tidak).
  // Maka: feed dengan LF seperti jarak gerbang, lalu "konten" berupa raster 1 baris dengan
  // satu titik di pojok kiri (0,125mm, praktis tak terlihat), baru potong.
  out.push(...feedDot(feed * FEED_DOT_PER_BARIS, spacing));
  out.push(...rasterKosong(1, LEBAR_DOT[lebar]));
  out.push(ESC, 0x32); // reset jarak baris
  // GS V 66 n = "feed n dot lalu partial cut" (standar Epson, dipakai semua software kasir).
  // Bila printer menghormati n, ini sendiri sudah memberi padding bawah.
  if (cut) out.push(GS, 0x56, 0x42, Math.min(255, feed * FEED_DOT_PER_BARIS));
  return Uint8Array.from(out);
}
