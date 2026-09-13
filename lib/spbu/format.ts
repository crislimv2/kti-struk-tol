import { bersihkan, gabungDuaKolom, pecahTanggal, potong } from "@/lib/struk/format";
import type { StrukLine } from "@/lib/struk/types";
import type { SpbuData } from "./types";

/** Struk SPBU: kertas 58mm, Font A = 32 kolom. */
export const KOLOM_SPBU = 32;

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

function A(text: string, align: StrukLine["align"] = "kiri"): StrukLine {
  return { text: potong(text, KOLOM_SPBU), align, font: "A" };
}

/** Garis putus-putus "- - - - " selebar kertas, dengan sela kecil di atas & bawah. */
function pemisah(): StrukLine[] {
  return [
    { text: "", align: "kiri", font: "A", kosong: true, tinggiDot: 8 },
    A("- ".repeat(KOLOM_SPBU / 2).trimEnd()),
    { text: "", align: "kiri", font: "A", kosong: true, tinggiDot: 8 },
  ];
}

/** "Label : nilai" dengan label dipadatkan ke lebar tertentu (seperti kolom di struk). */
function pasangan(label: string, nilai: string, lebarLabel: number): StrukLine {
  return A(`${label.padEnd(lebarLabel)}: ${nilai}`);
}

/** Bungkus paragraf menjadi baris <= lebar, tiap baris rata tengah. */
export function bungkusTengah(teks: string, lebar = KOLOM_SPBU): StrukLine[] {
  const kata = bersihkan(teks).split(/\s+/).filter(Boolean);
  const baris: string[] = [];
  let sekarang = "";
  for (const k of kata) {
    const coba = sekarang ? `${sekarang} ${k}` : k;
    if (coba.length <= lebar) sekarang = coba;
    else {
      if (sekarang) baris.push(sekarang);
      sekarang = k.length > lebar ? k.slice(0, lebar) : k;
    }
  }
  if (sekarang) baris.push(sekarang);
  return baris.map((b) => A(b, "tengah"));
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
  const { tanggal, jam } = pecahTanggal(d.waktu);
  const L: StrukLine[] = [];

  if (d.kode.trim()) L.push(A(d.kode.trim(), "tengah"));
  if (d.nama.trim()) L.push(A(d.nama.trim().toUpperCase(), "tengah"));
  if (d.alamat.trim()) L.push(A(d.alamat.trim().toUpperCase(), "tengah"));
  L.push({
    text: `Shift: ${d.shift.trim()}`,
    kanan: `No. Trans: ${d.noTrans.trim()}`,
    align: "kiri",
    font: "A",
  });
  L.push(A(`Waktu: ${tanggal} ${jam}`));

  L.push(...pemisah());
  L.push(pasangan("Pulau/Pompa", d.pulauPompa.trim(), 12));
  L.push(pasangan("Operator", d.operator.trim().toUpperCase(), 12));
  L.push(pasangan("Jenis BBM", d.jenisBbm.trim().toUpperCase(), 12));
  L.push(pasangan("Volume", formatLiter(d.volume), 12));

  L.push(...pemisah());
  L.push(A("Informasi Harga BBM (Rp/Liter)"));
  if (d.subsidi) {
    const subsidiPerLiter = Math.max(0, d.hargaNonSubsidi - d.hargaJual);
    const w = Math.max(angkaKoma(d.hargaNonSubsidi).length, angkaKoma(subsidiPerLiter).length, angkaKoma(d.hargaJual).length);
    L.push(pasangan("Harga Non Subsidi", angkaKoma(d.hargaNonSubsidi).padStart(w), 19));
    L.push(pasangan("Subsidi Pemerintah", angkaKoma(subsidiPerLiter).padStart(w), 19));
    L.push(pasangan("Harga Jual", angkaKoma(d.hargaJual).padStart(w), 19));
  } else {
    L.push(pasangan("Harga Jual", angkaKoma(d.hargaJual), 19));
  }

  L.push(...pemisah());
  L.push(A("Total Penjualan (Rp)"));
  if (d.subsidi) {
    const w = Math.max(angkaKoma(d.totalTanpaSubsidi).length, angkaKoma(d.totalSubsidi).length, angkaKoma(d.dibayar).length);
    L.push(pasangan("Tanpa Subsidi", angkaKoma(d.totalTanpaSubsidi).padStart(w), 19));
    L.push(pasangan("Subsidi Pemerintah", angkaKoma(d.totalSubsidi).padStart(w), 19));
    L.push(pasangan("Dibayar Konsumen", angkaKoma(d.dibayar).padStart(w), 19));
  } else {
    L.push(pasangan("Dibayar Konsumen", angkaKoma(d.dibayar), 19));
  }

  L.push(...pemisah());
  L.push(A(d.metode.trim().toUpperCase() || "CASH"));
  L.push(A(gabungDuaKolom("", angkaKoma(d.dibayar), KOLOM_SPBU)));

  L.push(...pemisah());
  L.push(pasangan("No. Plat", d.noPlat.trim().toUpperCase(), 10));

  if (d.subsidi && d.catatanSubsidi) {
    L.push(...pemisah());
    L.push(
      ...bungkusTengah(
        `Anda mendapat subsidi dari Pemerintah sebesar Rp ${angkaKoma(d.totalSubsidi)} (Perhitungan Subsidi Unaudited atau Estimasi). Gunakan BBM Subsidi secara bijak.`,
      ),
    );
  }
  return L;
}
