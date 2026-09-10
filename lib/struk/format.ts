import { findOperator } from "./presets";
import type { FontStruk, GayaStruk, LebarKertas, LogoBitmap, StrukData, StrukLine } from "./types";

/** Lebar area cetak dalam dot (203 dpi): 58mm = 384, 80mm = 576. */
export const LEBAR_DOT: Record<LebarKertas, number> = { 58: 384, 80: 576 };
/** Lebar glyph font printer: Font A 12 dot, Font B 9 dot. */
export const LEBAR_CHAR: Record<FontStruk, number> = { A: 12, B: 9 };
/** Jarak antar logo (dot) bila lebih dari satu logo berdampingan. */
export const LOGO_GAP = 12;

/** Jumlah kolom untuk font pada lebar kertas tertentu (58mm: A 32 / B 42; 80mm: A 48 / B 64). */
export function kolom(font: FontStruk, lebar: LebarKertas = 58): number {
  return Math.floor(LEBAR_DOT[lebar] / LEBAR_CHAR[font]);
}

/** Lebar total blok logo (dot) dan posisi kirinya bila diratakan tengah. */
export function geometriLogo(logos: LogoBitmap[], lebar: LebarKertas) {
  const total = logos.reduce((s, l) => s + l.width, 0) + LOGO_GAP * Math.max(0, logos.length - 1);
  const kiri = Math.max(0, Math.floor((LEBAR_DOT[lebar] - total) / 2));
  return { total, kiri };
}

/** Hanya ASCII yang bisa dicetak; karakter lain diganti agar printer tidak salah code page. */
export function bersihkan(s: string): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

export function potong(s: string, w: number): string {
  const t = bersihkan(s);
  return t.length > w ? t.slice(0, w) : t;
}

export function pecahTanggal(iso: string): { tanggal: string; jam: string } {
  const d = iso ? new Date(iso) : new Date();
  const v = !Number.isNaN(d.getTime()) ? d : new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    tanggal: `${p(v.getDate())}/${p(v.getMonth() + 1)}/${v.getFullYear()}`,
    jam: `${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`,
  };
}

const bulat = (n: number) => Math.max(0, Math.round(Number.isFinite(n) ? n : 0));

/** "Rp16500" | "16500" | "Rp 16.500" */
export function formatTarif(n: number, gaya: GayaStruk): string {
  const v = bulat(n);
  switch (gaya.tarif) {
    case "polos":
      return String(v);
    case "rp-titik":
      return "Rp " + v.toLocaleString("id-ID");
    default:
      return "Rp" + v;
  }
}

/** Saldo selalu "Rp.81820" di semua foto. */
export function formatSaldo(n: number): string {
  return "Rp." + bulat(n);
}

export function formatCn(cn: string, gaya: GayaStruk): string {
  const digits = (cn ?? "").replace(/\D/g, "");
  return gaya.cnTanpaNol ? digits.replace(/^0+/, "") : digits;
}

export function formatKartu(label: string, gaya: GayaStruk): string {
  const t = bersihkan(label).trim();
  return gaya.kartu === "kapital" ? t.toUpperCase() : t;
}

export function barisAsal(d: StrukData): string | null {
  if (d.sistem !== "tertutup") return null;
  const nama = bersihkan(d.asalNama).trim().toUpperCase();
  if (d.gaya.asal === "gb") return nama ? `Asal GB : ${nama}` : null;
  const kode = bersihkan(d.asalKode).trim();
  if (!kode && !nama) return null;
  return `Asal Gerbang : ${kode}${nama ? ` [${nama}]` : ""}`;
}

/** Gabungkan dua kolom (kiri + kanan) menjadi satu string selebar w kolom. */
export function gabungDuaKolom(kiri: string, kanan: string, w: number): string {
  const l = potong(kiri, w);
  const r = potong(kanan, Math.max(0, w - l.length - 1));
  const spasi = Math.max(1, w - l.length - r.length);
  return l + " ".repeat(spasi) + r;
}

/**
 * Render struk sesuai layout foto asli:
 *   [logo]                       (dikirim terpisah sebagai bitmap, rata tengah)
 *   TRANSJAWA TOL                Font B tebal, rata di bawah wordmark logo
 *   Info Tol : (ikon) 133        Font B tengah
 *   CIKAMPEK UTAMA 1             Font A tebal tengah
 *   (kosong)
 *   23/07/2026 08:54:55 07/01/04 Font B dua kolom
 *   Seri:398446  150776-250025
 *   Asal Gerbang : 41 [JAPEK OPEN]   (tertutup)
 *   Gol-3 e-Toll BCA       40500 Font A tebal dua kolom
 *   CN:0145202401284656 Rp.460320 Font B
 *   HARAP SEGERA ISI ULANG.      (opsional)
 *
 * `logos` dipakai untuk menghitung posisi sub-judul (di bawah wordmark).
 */
export function renderStruk(d: StrukData, logos: LogoBitmap[] = []): StrukLine[] {
  const g = d.gaya;
  const lebar: LebarKertas = d.lebarKertas === 80 ? 80 : 58;
  const wA = kolom("A", lebar);
  const wB = kolom("B", lebar);
  const { tanggal, jam } = pecahTanggal(d.tanggal);
  const L: StrukLine[] = [];
  const B = (text: string, align: StrukLine["align"] = "kiri", bold = false): StrukLine => ({
    text: potong(text, wB),
    align,
    font: "B",
    bold,
  });

  if (d.subJudul.trim()) {
    // rata di bawah wordmark logo pertama (Jasa Marga: setelah simbol; HK: tepi kiri logo)
    const { kiri } = geometriLogo(logos, lebar);
    const indentDot = logos.length > 0 ? kiri + (logos[0].wordmarkX ?? 0) : 0;
    const sisaKolom = Math.max(8, wB - Math.round(indentDot / LEBAR_CHAR.B));
    L.push({
      text: potong(d.subJudul.trim(), sisaKolom),
      align: "kiri",
      font: "B",
      bold: true,
      indentDot,
    });
  }
  if (d.infoTol.trim()) {
    if (findOperator(d.operatorId).ikonTelepon) {
      L.push({
        text: "Info Tol : ",
        ikonTelepon: true,
        teksSetelahIkon: " " + potong(d.infoTol.trim(), wB - 14),
        align: "tengah",
        font: "B",
      });
    } else {
      L.push(B(`Info Tol : ${d.infoTol.trim()}`, "tengah"));
    }
  }
  // Template 80mm: font diperbesar. Baris Font B naik ke Font A; baris yang di 58mm sudah
  // Font A (gerbang, GOL) dicetak Font A tinggi ganda.
  const besar = lebar === 80;
  const fontB: FontStruk = besar ? "A" : "B";
  if (d.gerbang.trim()) {
    // di struk asli nama gerbang Font A bobot normal (lebih besar dari baris tanggal, tidak setebal GOL)
    L.push({
      text: potong(d.gerbang.toUpperCase(), wA),
      align: "tengah",
      font: "A",
      bold: false,
      tinggiGanda: besar,
    });
  }
  // jarak di bawah nama gerbang: di struk asli sekitar 1,5 baris kosong (~36 dot)
  L.push({
    text: "",
    align: "kiri",
    font: fontB,
    kosong: true,
    tinggiDot: Math.round(36 * (besar ? 1.5 : 1)),
  });

  // Kertas 80mm: blok transaksi tetap selebar 58mm dan diletakkan di tengah (foto HK),
  // bukan direntang selebar kertas. Lebar blok dihitung dengan font yang dipakai di 80mm.
  const blok = (font: FontStruk): StrukLine["blok"] =>
    besar
      ? { kolom: kolom(font, 58), offset: Math.floor((kolom(font, 80) - kolom(font, 58)) / 2) }
      : undefined;
  const T = (text: string, font: FontStruk, bold = false, tinggiGanda = false): StrukLine => ({
    text: potong(text, kolom(font, 58)),
    align: "kiri",
    font,
    bold,
    blok: blok(font),
    tinggiGanda: besar && tinggiGanda,
  });

  L.push({ ...T(`${tanggal} ${jam}`, fontB), kanan: d.kodeGardu.trim() });
  L.push({ ...T(`${g.seri}${d.noSeri.trim()}`, fontB), kanan: d.kodeTrx.trim() });

  const asal = barisAsal(d);
  if (asal) L.push(T(asal, fontB));

  const gol = `${g.gol}${Math.max(1, Math.round(d.golongan || 1))} ${formatKartu(d.kartuLabel, g)}`;
  // Font A ukuran besar sudah cukup; struk asli tidak memakai tebal (keputusan owner 2026-09-10)
  L.push({ ...T(gol, "A", false, true), kanan: formatTarif(d.tarif, g) });

  L.push(T(`CN:${formatCn(d.cn, g)} ${formatSaldo(d.saldo)}`, fontB));
  if (d.peringatanSaldo) L.push(T("HARAP SEGERA ISI ULANG.", fontB));
  return L;
}

/** Susun isi baris (tanpa perataan tengah) sesuai blok 58mm bila ada. */
export function isiBaris(line: StrukLine, lebar: LebarKertas): string {
  const wPenuh = kolom(line.font, lebar);
  const w = line.blok?.kolom ?? wPenuh;
  const isi = line.kanan ? gabungDuaKolom(line.text, line.kanan, w) : potong(line.text, w);
  const offset = line.blok?.offset ?? 0;
  return potong(" ".repeat(offset) + isi, wPenuh);
}

/** Baris menjadi string tunggal selebar kolom font (untuk pratinjau teks, riwayat, Supabase). */
export function barisKeTeks(line: StrukLine, lebar: LebarKertas = 58): string {
  const w = kolom(line.font, lebar);
  if (line.kosong) return "";
  if (line.kanan || line.blok) return isiBaris(line, lebar);
  const isi = line.ikonTelepon ? `${line.text}(T)${line.teksSetelahIkon ?? ""}` : line.text;
  if (line.indentDot) {
    const pad = Math.round(line.indentDot / LEBAR_CHAR[line.font]);
    return potong(" ".repeat(pad) + isi, w);
  }
  if (line.align === "tengah") {
    const t = potong(isi.trim(), w);
    return " ".repeat(Math.floor((w - t.length) / 2)) + t;
  }
  return potong(isi, w);
}

/** Nilai untuk input datetime-local (step=1) dalam zona waktu lokal. */
export function sekarangLokal(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}
