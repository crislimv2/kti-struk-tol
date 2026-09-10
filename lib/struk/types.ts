export type SistemTol = "terbuka" | "tertutup";
/** Lebar kertas struk asli: 58mm (Jasa Marga, Waskita) atau 80mm (Hutama Karya). */
export type LebarKertas = 58 | 80;

/** Gaya penulisan per mesin gerbang (diambil dari foto struk asli). */
export interface GayaStruk {
  /** Label nomor seri: "No seri :" | "Seri:" | "No Seri : " */
  seri: "No seri :" | "Seri:" | "No Seri : ";
  /** Pemisah kode transaksi: 008422/250033 atau 150776-250025 */
  kodePemisah: "/" | "-";
  /** Baris asal gerbang: "gerbang" -> "Asal Gerbang : 41 [JAPEK OPEN]", "gb" -> "Asal GB : KUNCIRAN 5" */
  asal: "gerbang" | "gb";
  /** Awalan golongan: "GOL-" | "Gol-" */
  gol: "GOL-" | "Gol-";
  /** Huruf label kartu: "e-Toll BCA" | "E-TOLL BCA" */
  kartu: "normal" | "kapital";
  /** Format tarif: "Rp16500" | "16500" | "Rp 16.500" */
  tarif: "rp" | "polos" | "rp-titik";
  /** Hutama Karya mencetak CN tanpa 0 di depan */
  cnTanpaNol: boolean;
}

export interface StrukData {
  id: string;
  gerbangId: string;
  operatorId: string;
  logoIds: string[];
  subJudul: string;
  infoTol: string;
  gerbang: string;
  lebarKertas: LebarKertas;
  /** datetime-local, contoh "2026-07-14T19:58:40" */
  tanggal: string;
  /** contoh "09/03/03" */
  kodeGardu: string;
  noSeri: string;
  /** contoh "008422/250033" atau "150776-250025" */
  kodeTrx: string;
  sistem: SistemTol;
  asalKode: string;
  asalNama: string;
  golongan: number;
  /** contoh "e-Toll BCA" */
  kartuLabel: string;
  tarif: number;
  /** nomor kartu, contoh "0145202401284656" */
  cn: string;
  saldo: number;
  /** cetak "HARAP SEGERA ISI ULANG." */
  peringatanSaldo: boolean;
  gaya: GayaStruk;
  createdAt: string;
}

export type FontStruk = "A" | "B";

/** Satu baris hasil render, siap dikirim ke printer atau ditampilkan di pratinjau. */
export interface StrukLine {
  text: string;
  align: "kiri" | "tengah";
  font: FontStruk;
  bold?: boolean;
  /** teks rata kanan pada baris yang sama (dua kolom) */
  kanan?: string;
  /** baris kosong pemisah */
  kosong?: boolean;
  /** tinggi baris kosong dalam dot (ESC J n); tanpa ini dipakai jarak baris biasa */
  tinggiDot?: number;
  /** cetak ikon telepon-lingkaran setelah `text`, lalu `teksSetelahIkon` (baris Info Tol) */
  ikonTelepon?: boolean;
  teksSetelahIkon?: string;
  /** geser teks dari tepi kiri sebanyak n dot (sub-judul di bawah wordmark logo) */
  indentDot?: number;
  /**
   * Kertas 80mm: baris transaksi disusun dalam blok selebar `kolom` kolom (= lebar 58mm)
   * lalu digeser `offset` kolom agar blok berada di tengah kertas (bukan space-between).
   */
  blok?: { kolom: number; offset: number };
  /** cetak dengan tinggi ganda (GS ! 0x01) - dipakai template 80mm untuk gerbang & GOL */
  tinggiGanda?: boolean;
}

export interface LogoBitmap {
  id: string;
  width: number;
  height: number;
  bytesPerRow: number;
  /** x (dot) awal wordmark di dalam logo; sub-judul diratakan ke sini. 0 = tepi kiri logo */
  wordmarkX?: number;
  /** base64 dari bit 1bpp, MSB = pixel kiri, tiap baris dibulatkan ke byte */
  data: string;
}

export interface PrinterInfo {
  name: string;
  port: string;
  status: string;
}

export interface PrintResult {
  ok: boolean;
  message: string;
  printer?: string;
  bytes?: number;
}
