import type { GayaStruk, LebarKertas, SistemTol } from "./types";

/** Armada KTI: Hino Euro 4 FL260JW (6x2, 3 gandar) = Golongan 3. */
export const DEFAULT_GOLONGAN = 3;
export const DEFAULT_UNIT = { nama: "HINO EURO 4 FL260JW", golongan: DEFAULT_GOLONGAN };

/** Saldo di bawah ini otomatis mencetak "HARAP SEGERA ISI ULANG." */
export const AMBANG_SALDO_RENDAH = 20_000;

export const GAYA_PRESETS: Record<"halim" | "transjawa" | "kunciran" | "hk", GayaStruk> = {
  /** Foto Halim, Cikunir 4 New, Bekasi Barat 1 */
  halim: {
    seri: "No seri :",
    kodePemisah: "/",
    asal: "gerbang",
    gol: "GOL-",
    kartu: "normal",
    tarif: "rp",
    cnTanpaNol: false,
  },
  /** Foto Cikampek Utama 1, Mabar 2, Kramasan */
  transjawa: {
    seri: "Seri:",
    kodePemisah: "-",
    asal: "gerbang",
    gol: "Gol-",
    kartu: "normal",
    tarif: "polos",
    cnTanpaNol: false,
  },
  /** Foto Benda Utama 4 */
  kunciran: {
    seri: "No Seri : ",
    kodePemisah: "/",
    asal: "gb",
    gol: "GOL-",
    kartu: "kapital",
    tarif: "rp-titik",
    cnTanpaNol: false,
  },
  /** Foto Pekanbaru, HK-KAU */
  hk: {
    seri: "Seri:",
    kodePemisah: "-",
    asal: "gerbang",
    gol: "Gol-",
    kartu: "normal",
    tarif: "rp",
    cnTanpaNol: true,
  },
};

export interface OperatorPreset {
  id: string;
  nama: string;
  logoIds: string[];
  subJudul: string;
  infoTol: string;
  /** cetak ikon telepon-lingkaran sebelum nomor Info Tol (template Jasa Marga, HK) */
  ikonTelepon: boolean;
  /** lebar kertas struk asli operator ini */
  lebarKertas: LebarKertas;
}

export const OPERATORS: OperatorPreset[] = [
  {
    id: "jm-ihc",
    nama: "Jasa Marga (Indonesia Highway Corporation)",
    // logo dari foto asli sudah memuat tagline "Indonesia Highway Corporation"
    logoIds: ["jasamarga-ihc"],
    subJudul: "",
    infoTol: "14080",
    ikonTelepon: true,
    lebarKertas: 58,
  },
  {
    id: "jtt",
    nama: "Jasamarga Transjawa Tol",
    logoIds: ["jasamarga"],
    subJudul: "TRANSJAWA TOL",
    infoTol: "133",
    ikonTelepon: true,
    lebarKertas: 58,
  },
  {
    id: "jkc",
    nama: "Jasamarga Kunciran Cengkareng",
    logoIds: ["jasamarga"],
    subJudul: "KUNCIRAN CENGKARENG",
    infoTol: "133",
    ikonTelepon: true,
    lebarKertas: 58,
  },
  {
    id: "hk",
    nama: "Hutama Karya - Trans Sumatera",
    logoIds: ["hutamakarya", "transsumatera"],
    subJudul: "PT HUTAMA KARYA (PERSERO)",
    infoTol: "0813 2900 0020",
    ikonTelepon: true,
    lebarKertas: 80,
  },
  {
    id: "waskita",
    nama: "Waskita Sriwijaya Tol",
    logoIds: ["waskita"],
    subJudul: "SRIWIJAYATOL",
    infoTol: "0711-5641470",
    ikonTelepon: false,
    lebarKertas: 58,
  },
  {
    id: "custom",
    nama: "Lainnya (isi manual)",
    logoIds: [],
    subJudul: "",
    infoTol: "",
    ikonTelepon: false,
    lebarKertas: 58,
  },
];

export interface GerbangPreset {
  id: string;
  nama: string;
  operatorId: string;
  sistem: SistemTol;
  gaya: keyof typeof GAYA_PRESETS;
  /** override info tol bila mesin gerbang mencetak nomor berbeda */
  infoTol?: string;
  asalKode?: string;
  asalNama?: string;
}

const jm = (id: string, nama: string, extra: Partial<GerbangPreset> = {}): GerbangPreset => ({
  id,
  nama,
  operatorId: "jm-ihc",
  sistem: "terbuka",
  gaya: "halim",
  ...extra,
});

export const GERBANG_PRESETS: GerbangPreset[] = [
  // Jasa Marga IHC, sistem terbuka, Info Tol 14080 (foto Halim)
  jm("halim", "HALIM"),
  jm("meruya-utama-2", "MERUYA UTAMA 2"),
  jm("cikarang-barat-5", "CIKARANG BARAT 5"),
  jm("sentul-2", "SENTUL 2"),
  jm("cimanggis-5", "CIMANGGIS 5"),
  jm("cikunir-4-new", "CIKUNIR 4 NEW", { infoTol: "133" }),
  // Palikanci (tertutup)
  jm("kanci", "KANCI", { sistem: "tertutup", asalKode: "01", asalNama: "PLUMBON" }),
  // Belmera / Medan (foto Mabar 2)
  jm("mabar-2", "MABAR 2", {
    sistem: "tertutup",
    gaya: "transjawa",
    infoTol: "133",
    asalKode: "09",
    asalNama: "AMPLAS",
  }),
  // Jasamarga Transjawa Tol (foto Cikampek Utama 1, Bekasi Barat 1)
  {
    id: "cikampek-utama-1",
    nama: "CIKAMPEK UTAMA 1",
    operatorId: "jtt",
    sistem: "tertutup",
    gaya: "transjawa",
    asalKode: "41",
    asalNama: "JAPEK OPEN",
  },
  {
    id: "cikampek-utama-2",
    nama: "CIKAMPEK UTAMA 2",
    operatorId: "jtt",
    sistem: "tertutup",
    gaya: "transjawa",
    asalKode: "41",
    asalNama: "JAPEK OPEN",
  },
  {
    id: "kandeman",
    nama: "KANDEMAN",
    operatorId: "jtt",
    sistem: "tertutup",
    gaya: "transjawa",
    asalKode: "41",
    asalNama: "JAPEK OPEN",
  },
  { id: "bekasi-barat-1", nama: "BEKASI BARAT 1", operatorId: "jtt", sistem: "terbuka", gaya: "halim" },
  // Jasamarga Kunciran Cengkareng (foto Benda Utama 4)
  {
    id: "kunciran-4",
    nama: "KUNCIRAN 4",
    operatorId: "jkc",
    sistem: "tertutup",
    gaya: "kunciran",
    asalNama: "BENDA UTAMA 4",
  },
  {
    id: "benda-utama-4",
    nama: "BENDA UTAMA 4",
    operatorId: "jkc",
    sistem: "tertutup",
    gaya: "kunciran",
    asalNama: "KUNCIRAN 5",
  },
  // Hutama Karya Trans Sumatera (foto Pekanbaru, HK-KAU)
  { id: "pekanbaru", nama: "PEKANBARU", operatorId: "hk", sistem: "tertutup", gaya: "hk", infoTol: "0821 7608 8880", asalKode: "08", asalNama: "BATHIN SOL" },
  { id: "hk-kau", nama: "HK-KAU", operatorId: "hk", sistem: "tertutup", gaya: "hk", asalKode: "17", asalNama: "LBKB" },
  { id: "lambu-kibang-6", nama: "LAMBU KIBANG 6", operatorId: "hk", sistem: "tertutup", gaya: "hk", asalKode: "17", asalNama: "LBKB" },
  { id: "bakauheni-selatan", nama: "BAKAUHENI SELATAN", operatorId: "hk", sistem: "tertutup", gaya: "hk", asalKode: "01", asalNama: "TERBANGGI" },
  { id: "gunung-sugih", nama: "GUNUNG SUGIH", operatorId: "hk", sistem: "tertutup", gaya: "hk", asalKode: "01", asalNama: "BAKAUHENI" },
  // Waskita Sriwijaya Tol (foto Kramasan)
  { id: "kramasan", nama: "KRAMASAN", operatorId: "waskita", sistem: "tertutup", gaya: "transjawa", asalKode: "22", asalNama: "MST-KAU" },
  // Manual
  { id: "custom", nama: "Lainnya (isi manual)", operatorId: "custom", sistem: "terbuka", gaya: "halim" },
];

export interface KartuPreset {
  label: string;
  prefix: string;
}

/** Kartu e-Toll BCA armada yang muncul di sebagian besar foto struk. */
export const DEFAULT_CN = "0145202401284656";

export const KARTU_PRESETS: KartuPreset[] = [
  { label: "e-Toll BCA", prefix: "0145" },
  { label: "e-Toll Mandiri", prefix: "603298" },
  { label: "e-Toll BNI", prefix: "2028" },
  { label: "e-Toll BRI", prefix: "601350" },
];

export function findOperator(id: string): OperatorPreset {
  return OPERATORS.find((o) => o.id === id) ?? OPERATORS[OPERATORS.length - 1];
}

export function findGerbang(id: string): GerbangPreset {
  return GERBANG_PRESETS.find((g) => g.id === id) ?? GERBANG_PRESETS[GERBANG_PRESETS.length - 1];
}

const acak = (digit: number) =>
  String(Math.floor(Math.random() * 10 ** digit)).padStart(digit, "0");

const antara = (min: number, max: number) =>
  String(min + Math.floor(Math.random() * (max - min + 1))).padStart(2, "0");

/** "09/03/03": pola di foto 04-12 / 01-03 / 01-04 (gardu / shift / periode) */
export function buatKodeGardu(): string {
  return `${antara(4, 12)}/${antara(1, 3)}/${antara(1, 4)}`;
}

export function buatNoSeri(): string {
  return acak(6);
}

/**
 * Nomor kartu acak dengan jumlah digit sama seperti `cnSekarang` (default 16).
 * Awalan bank (prefix preset yang cocok dengan label kartu) dipertahankan.
 */
export function buatCn(cnSekarang: string, kartuLabel: string): string {
  const digitLama = (cnSekarang ?? "").replace(/\D/g, "");
  const panjang = digitLama.length >= 8 ? digitLama.length : 16;
  const preset = KARTU_PRESETS.find((k) => k.label === kartuLabel);
  const prefix =
    preset && digitLama.startsWith(preset.prefix)
      ? preset.prefix
      : (preset?.prefix ?? digitLama.slice(0, 4));
  const sisa = Math.max(0, panjang - prefix.length);
  return (prefix + acak(sisa)).slice(0, panjang);
}

/** "008422/250033" atau "150776-250025" */
export function buatKodeTrx(pemisah: GayaStruk["kodePemisah"]): string {
  return `${acak(6)}${pemisah}${acak(6)}`;
}
