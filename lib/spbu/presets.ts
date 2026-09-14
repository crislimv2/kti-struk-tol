export interface SpbuPreset {
  id: string;
  /** kode SPBU 8 digit di bawah logo; kosong = tidak dicetak (hanya diketahui untuk AH. Nasution) */
  kode: string;
  nama: string;
  alamat: string;
  /** contoh No. Trans dari struk asli lokasi ini; No. Trans baru diacak di sekitar angka ini */
  noTransContoh: string;
}

/**
 * SPBU yang dipakai armada (daftar owner 2026-09-14, semua Bio Solar). Nama/alamat maks 32 kolom.
 * Tambah SPBU baru = satu entri di sini.
 */
export const SPBU_PRESETS: SpbuPreset[] = [
  { id: "ah-nasution-28", kode: "14201147", nama: "SPBU AH.NASUTION NO.28", alamat: "JL. A.H.NASUTION NO. 28 MEDAN", noTransContoh: "5130078" },
  { id: "lubuksikaping", kode: "", nama: "SPBU LUBUKSIKAPING", alamat: "LUBUKSIKAPING", noTransContoh: "884614" },
  { id: "desa-sei-buluh", kode: "", nama: "SPBU DESA SEI BULUH", alamat: "DESA SEI BULUH MUARA BULIAN", noTransContoh: "1749434" },
  { id: "mayjen-yusup-sengade", kode: "", nama: "SPBU MAYJEN YUSUP SENGADE", alamat: "JL. MAYJEN YUSUP SINGADEKANE", noTransContoh: "4002273" },
  { id: "km-121b-tol-cipali", kode: "", nama: "SPBU KM 121B TOL CIPALI", alamat: "REST AREA KM 121B TOL CIPALI", noTransContoh: "2202736" },
  { id: "ds-bagorkulon", kode: "", nama: "SPBU DS.BAGORKULON, BAGOR", alamat: "DS. BAGORKULON KEC. BAGOR", noTransContoh: "3735757" },
  { id: "rokan-hilir", kode: "", nama: "SPBU ROKAN HILIR - RIAU", alamat: "ROKAN HILIR - RIAU", noTransContoh: "1837158" },
  { id: "pluit-selatan", kode: "", nama: "SPBU PLUIT SELATAN", alamat: "JL. RAYA PLUIT SELATAN", noTransContoh: "2805838" },
  { id: "lintas-riau-sumut", kode: "", nama: "SPBU LINTAS RIAU - SUMUT", alamat: "LINTAS RIAU SUMUT", noTransContoh: "1972704" },
  { id: "toll-jakarta-merak", kode: "", nama: "SPBU TOLL JAKARTA MERAK", alamat: "JL. TOLL JAKARTA MERAK", noTransContoh: "4683759" },
  { id: "km-121-b-tol-cipali", kode: "", nama: "SPBU KM 121 B TOL CIPALI", alamat: "REST AREA KM 121 B TOL CIPALI", noTransContoh: "2182587" },
  { id: "ds-ketapang", kode: "", nama: "SPBU DS. KETAPANG", alamat: "JL. JEND.GATOT SUBROTO KETAPAN", noTransContoh: "5791911" },
  { id: "24-3021-64", kode: "", nama: "SPBU 24.3021.64", alamat: "SPBU MAYJEN YUSUP SINGADE", noTransContoh: "4002273" },
  { id: "14-2273-33", kode: "", nama: "SPBU 14.2273.33", alamat: "SPBU LINTAS SIPIROK KM 9,5", noTransContoh: "1972704" },
  { id: "24-351-113", kode: "", nama: "SPBU 24.351.113", alamat: "JL.RAYA CILEUNGSI - JONGGOL KM.1", noTransContoh: "2805838" },
  { id: "muara-baru", kode: "", nama: "SPBU MUARA BARU", alamat: "JL. MUARA BARU KEL PENJARINGAN", noTransContoh: "2805838" },
  { id: "lintas-sipirok-9-5", kode: "", nama: "SPBU LINTAS SIPIROK 9,5", alamat: "JL. LINTAS SIPIROK KM.9,5", noTransContoh: "1972704" },
  { id: "labuhan-kota-pinang", kode: "", nama: "SPBU LABUHAN KOTA PINANG", alamat: "JL. LABUHAN KOTA PINANG", noTransContoh: "1972704" },
  { id: "bantar-bolang-km-15", kode: "", nama: "SPBU BANTAR BOLANG KM.15", alamat: "JL. RAYA BANTAR BOLANG KM.15", noTransContoh: "3735757" },
  { id: "toll-jagorawi-km-21", kode: "", nama: "SPBU TOLL JAGORAWI KM.21", alamat: "REST AREA TOLL JAGORAWI KM.21", noTransContoh: "4683759" },
  { id: "tol-surabaya-gempol", kode: "", nama: "SPBU TOL SURABAYA GEMPOL", alamat: "JL. TOL SURABAYA GEMPOL KM.754", noTransContoh: "3735757" },
  { id: "padang-sidempuan-8-5", kode: "", nama: "SPBU PADANG SIDEMPUAN 8,5", alamat: "JL. PADANG SIDEMPUAN KM. 8,5", noTransContoh: "1972704" },
  { id: "panahan-blok-e-1", kode: "", nama: "SPBU PANAHAN BLOK E. NO 1", alamat: "JL. PANAHAN BLOK E.1 RT 30", noTransContoh: "2805838" },
  { id: "ds-sukoanyar-turi", kode: "", nama: "SPBU DS. SUKOANYAR TURI", alamat: "DS. SUKOANYAR TURI", noTransContoh: "3735757" },
  { id: "tol-surabaya-gresik", kode: "", nama: "SPBU TOL SURABAYA GRESIK", alamat: "JL. TOL SURABAYA GRESIK", noTransContoh: "3735757" },
  { id: "raya-brangsong", kode: "", nama: "SPBU RAYA BRANGSONG", alamat: "JL. RAYA BRANGSONG", noTransContoh: "3735757" },
  { id: "kp-cikuasa-grogol", kode: "", nama: "SPBU KP CIKUASA GROGOL", alamat: "JL. KP CIKUASA GROGOL", noTransContoh: "4683759" },
  { id: "sm-amin-arengka-2", kode: "", nama: "SPBU SM.AMIN ARENGKA 2", alamat: "JL. SM. AMIN ARENGKA 2", noTransContoh: "1837158" },
  { id: "desa-sukajaya", kode: "", nama: "SPBU DESA SUKAJAYA", alamat: "DESA SUKAJAYA BAYUNG LINCIR", noTransContoh: "1749434" },
  { id: "raya-kapuk-kamal", kode: "", nama: "SPBU RAYA KAPUK KAMAL", alamat: "JL.RAYA KAPUK KAMAL", noTransContoh: "2805838" },
  { id: "custom", kode: "", nama: "", alamat: "", noTransContoh: "" },
];

export interface BbmPreset {
  id: string;
  /** label persis seperti di struk */
  label: string;
  subsidi: boolean;
  hargaJual: number;
  /** harga keekonomian (Rp/liter); berubah tiap bulan, cek struk terbaru */
  hargaNonSubsidi: number;
}

/** Harga acuan Jul 2026 dari foto (Bio Solar). Lainnya perkiraan, ubah di form bila perlu. */
export const BBM_PRESETS: BbmPreset[] = [
  { id: "bio_solar", label: "BIO_SOLAR", subsidi: true, hargaJual: 6800, hargaNonSubsidi: 16555 },
  { id: "pertalite", label: "PERTALITE", subsidi: true, hargaJual: 10000, hargaNonSubsidi: 11700 },
  { id: "dexlite", label: "DEXLITE", subsidi: false, hargaJual: 13050, hargaNonSubsidi: 13050 },
  { id: "pertamina_dex", label: "PERTAMINA_DEX", subsidi: false, hargaJual: 13650, hargaNonSubsidi: 13650 },
  { id: "pertamax", label: "PERTAMAX", subsidi: false, hargaJual: 12350, hargaNonSubsidi: 12350 },
];

export const METODE_BAYAR = ["CASH", "DEBIT", "QRIS", "MYPERTAMINA"];

export function findSpbu(id: string): SpbuPreset {
  return SPBU_PRESETS.find((s) => s.id === id) ?? SPBU_PRESETS[SPBU_PRESETS.length - 1];
}

export function findBbm(label: string): BbmPreset | undefined {
  return BBM_PRESETS.find((b) => b.label === label);
}

const acak = (digit: number) =>
  String(Math.floor(Math.random() * 10 ** digit)).padStart(digit, "0");

/** contoh "5130078"; bila ada contoh dari lokasi, hasilnya di kisaran contoh s.d. contoh + 9.999 */
export function buatNoTrans(contoh = ""): string {
  const dasar = parseInt(contoh.replace(/\D/g, ""), 10);
  if (!Number.isFinite(dasar) || dasar <= 0) return acak(7);
  return String(dasar + Math.floor(Math.random() * 10_000));
}

/**
 * Hitung turunan dari volume + harga: total tanpa subsidi, subsidi, dibayar.
 * Dibayar dibulatkan ke rupiah; tanpa subsidi memakai volume penuh.
 */
export function hitungDariVolume(volume: number, hargaJual: number, hargaNonSubsidi: number) {
  const dibayar = Math.round(volume * hargaJual);
  const totalTanpaSubsidi = Math.round(volume * hargaNonSubsidi);
  return { dibayar, totalTanpaSubsidi, totalSubsidi: Math.max(0, totalTanpaSubsidi - dibayar) };
}

/** Dari nominal bayar (mis. Rp 100.000): volume = dibayar / hargaJual (2 desimal). */
export function hitungDariDibayar(dibayar: number, hargaJual: number, hargaNonSubsidi: number) {
  const volume = hargaJual > 0 ? Math.round((dibayar / hargaJual) * 100) / 100 : 0;
  const totalTanpaSubsidi = Math.round(volume * hargaNonSubsidi);
  return { volume, totalTanpaSubsidi, totalSubsidi: Math.max(0, totalTanpaSubsidi - dibayar) };
}
