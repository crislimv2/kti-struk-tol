import { bersihkan, gabungDuaKolom, kolom, pecahTanggal, potong } from "@/lib/struk/format";
import type { LebarKertas, StrukLine } from "@/lib/struk/types";
import type { SpbuData } from "./types";

/** Struk SPBU: blok teks selalu 32 kolom Font A (58mm). Di 80mm blok digeser ke tengah. */
export const KOLOM_SPBU = 32;

/** Blok 32 kolom di tengah kertas 80mm (offset 8 kolom); di 58mm tidak perlu. */
function blokUntuk(lebar: LebarKertas): StrukLine["blok"] {
  return lebar === 80
    ? { kolom: KOLOM_SPBU, offset: Math.floor((kolom("A", 80) - KOLOM_SPBU) / 2) }
    : undefined;
}

/** "16,555" - ribuan dengan koma seperti di struk Pertamina. */
export function angkaKoma(n: number): string {
  const v = Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
  return v.toLocaleString("en-US");
}

/** "14.70 liter" */
export function formatLiter(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(2)} liter`;
}

/** Baris Font A; rata kiri memakai blok 32 kolom (di 80mm digeser ke tengah), rata tengah = tengah kertas. */
function A(text: string, lebar: LebarKertas, align: StrukLine["align"] = "kiri"): StrukLine {
  return {
    text: potong(text, KOLOM_SPBU),
    align,
    font: "A",
    blok: align === "kiri" ? blokUntuk(lebar) : undefined,
  };
}

/** Garis putus-putus "- - - - " selebar kertas, dengan sela kecil di atas & bawah. */
function pemisah(lebar: LebarKertas): StrukLine[] {
  return [
    { text: "", align: "kiri", font: "A", kosong: true, tinggiDot: 8 },
    A("- ".repeat(KOLOM_SPBU / 2).trimEnd(), lebar),
    { text: "", align: "kiri", font: "A", kosong: true, tinggiDot: 8 },
  ];
}

/** "Label : nilai" dengan label dipadatkan ke lebar tertentu (seperti kolom di struk). */
function pasangan(label: string, nilai: string, lebarLabel: number, lebar: LebarKertas): StrukLine {
  return A(`${label.padEnd(lebarLabel)}: ${nilai}`, lebar);
}

/** Bungkus paragraf menjadi baris <= lebar, tiap baris rata tengah. */
export function bungkusTengah(teks: string, lebar: LebarKertas, lebarKolom = KOLOM_SPBU): StrukLine[] {
  const kata = bersihkan(teks).split(/\s+/).filter(Boolean);
  const baris: string[] = [];
  let sekarang = "";
  for (const k of kata) {
    const coba = sekarang ? `${sekarang} ${k}` : k;
    if (coba.length <= lebarKolom) sekarang = coba;
    else {
      if (sekarang) baris.push(sekarang);
      sekarang = k.length > lebarKolom ? k.slice(0, lebarKolom) : k;
    }
  }
  if (sekarang) baris.push(sekarang);
  return baris.map((b) => A(b, lebar, "tengah"));
}

/**
 * Render struk SPBU sesuai foto:
 *   [logo Pertamina]                (raster kepala)
 *   14201147                        tengah
 *   SPBU AH.NASUTION NO.28          tengah
 *   JL. A.H.NASUTION NO. 28 MEDAN   tengah
 *   Shift: 3      No. Trans: 5130078
 *   Waktu: 19/07/2026 00:13:02
 *   - - - - - - - - - - - - - - - -
 *   Pulau/Pompa : 11
 *   Operator    : RAIHAN
 *   Jenis BBM   : BIO_SOLAR
 *   Volume      : 14.70 liter
 *   - - - -
 *   Informasi Harga BBM (Rp/Liter)
 *   Harga Non Subsidi  : 16,555
 *   Subsidi Pemerintah :  9,755
 *   Harga Jual         :  6,800
 *   - - - -
 *   Total Penjualan (Rp)
 *   Tanpa Subsidi      : 243,398
 *   Subsidi Pemerintah : 143,398
 *   Dibayar Konsumen   : 100,000
 *   - - - -
 *   CASH
 *                            100,000
 *   - - - -
 *   No. Plat  : K1924ES
 *   - - - -
 *   Anda mendapat subsidi dari ... (paragraf rata tengah)
 */
export function renderSpbu(d: SpbuData): StrukLine[] {
  const lebar: LebarKertas = d.lebarKertas === 80 ? 80 : 58;
  const { tanggal, jam } = pecahTanggal(d.waktu);
  const L: StrukLine[] = [];

  if (d.kode.trim()) L.push(A(d.kode.trim(), lebar, "tengah"));
  if (d.nama.trim()) L.push(A(d.nama.trim().toUpperCase(), lebar, "tengah"));
  if (d.alamat.trim()) L.push(A(d.alamat.trim().toUpperCase(), lebar, "tengah"));
  L.push({
    text: `Shift: ${d.shift.trim()}`,
    kanan: `No. Trans: ${d.noTrans.trim()}`,
    align: "kiri",
    font: "A",
    blok: blokUntuk(lebar) ?? { kolom: KOLOM_SPBU, offset: 0 },
  });
  L.push(A(`Waktu: ${tanggal} ${jam}`, lebar));

  L.push(...pemisah(lebar));
  L.push(pasangan("Pulau/Pompa", d.pulauPompa.trim(), 12, lebar));
  L.push(pasangan("Operator", d.operator.trim().toUpperCase(), 12, lebar));
  L.push(pasangan("Jenis BBM", d.jenisBbm.trim().toUpperCase(), 12, lebar));
  L.push(pasangan("Volume", formatLiter(d.volume), 12, lebar));

  L.push(...pemisah(lebar));
  L.push(A("Informasi Harga BBM (Rp/Liter)", lebar));
  if (d.subsidi) {
    const subsidiPerLiter = Math.max(0, d.hargaNonSubsidi - d.hargaJual);
    const w = Math.max(angkaKoma(d.hargaNonSubsidi).length, angkaKoma(subsidiPerLiter).length, angkaKoma(d.hargaJual).length);
    L.push(pasangan("Harga Non Subsidi", angkaKoma(d.hargaNonSubsidi).padStart(w), 19, lebar));
    L.push(pasangan("Subsidi Pemerintah", angkaKoma(subsidiPerLiter).padStart(w), 19, lebar));
    L.push(pasangan("Harga Jual", angkaKoma(d.hargaJual).padStart(w), 19, lebar));
  } else {
    L.push(pasangan("Harga Jual", angkaKoma(d.hargaJual), 19, lebar));
  }

  L.push(...pemisah(lebar));
  L.push(A("Total Penjualan (Rp)", lebar));
  if (d.subsidi) {
    const w = Math.max(angkaKoma(d.totalTanpaSubsidi).length, angkaKoma(d.totalSubsidi).length, angkaKoma(d.dibayar).length);
    L.push(pasangan("Tanpa Subsidi", angkaKoma(d.totalTanpaSubsidi).padStart(w), 19, lebar));
    L.push(pasangan("Subsidi Pemerintah", angkaKoma(d.totalSubsidi).padStart(w), 19, lebar));
    L.push(pasangan("Dibayar Konsumen", angkaKoma(d.dibayar).padStart(w), 19, lebar));
  } else {
    L.push(pasangan("Dibayar Konsumen", angkaKoma(d.dibayar), 19, lebar));
  }

  L.push(...pemisah(lebar));
  L.push(A(d.metode.trim().toUpperCase() || "CASH", lebar));
  L.push(A(gabungDuaKolom("", angkaKoma(d.dibayar), KOLOM_SPBU), lebar));

  L.push(...pemisah(lebar));
  L.push(pasangan("No. Plat", d.noPlat.trim().toUpperCase(), 10, lebar));

  if (d.subsidi && d.catatanSubsidi) {
    L.push(...pemisah(lebar));
    L.push(
      ...bungkusTengah(
        `Anda mendapat subsidi dari Pemerintah sebesar Rp ${angkaKoma(d.totalSubsidi)} (Perhitungan Subsidi Unaudited atau Estimasi). Gunakan BBM Subsidi secara bijak.`,
        lebar,
      ),
    );
  }
  return L;
}
