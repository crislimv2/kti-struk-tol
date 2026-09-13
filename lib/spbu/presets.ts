export interface SpbuPreset {
  id: string;
  kode: string;
  nama: string;
  alamat: string;
}

/** SPBU dari foto struk armada. Tambah SPBU baru = satu entri di sini. */
export const SPBU_PRESETS: SpbuPreset[] = [
  {
    id: "ah-nasution-28",
    kode: "14201147",
    nama: "SPBU AH.NASUTION NO.28",
    alamat: "JL. A.H.NASUTION NO. 28 MEDAN",
  },
  { id: "custom", kode: "", nama: "", alamat: "" },
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

/** contoh "5130078" */
export function buatNoTrans(): string {
  return acak(7);
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
