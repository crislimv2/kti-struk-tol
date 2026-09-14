import type { LebarKertas } from "@/lib/struk/types";

/**
 * Struk SPBU Pertamina (format dari foto struk armada, Jul 2026). Font A 32 kolom.
 * Kertas 58mm = blok rapat kiri; 80mm = logo 1,5x, blok 32 kolom di tengah kertas.
 */
export interface SpbuData {
  jenis: "spbu";
  id: string;
  lebarKertas: LebarKertas;
  spbuId: string;
  /** kode SPBU di bawah logo, contoh "14201147" */
  kode: string;
  /** contoh "SPBU AH.NASUTION NO.28" */
  nama: string;
  /** contoh "JL. A.H.NASUTION NO. 28 MEDAN" */
  alamat: string;
  shift: string;
  noTrans: string;
  /** datetime-local */
  waktu: string;
  pulauPompa: string;
  operator: string;
  /** contoh "BIO_SOLAR" */
  jenisBbm: string;
  /** liter, 2 desimal */
  volume: number;
  /** BBM bersubsidi: cetak blok Informasi Harga + Subsidi + catatan */
  subsidi: boolean;
  hargaNonSubsidi: number;
  hargaJual: number;
  /** total tanpa subsidi (volume x harga non subsidi), bisa diubah manual */
  totalTanpaSubsidi: number;
  /** total subsidi pemerintah (tanpaSubsidi - dibayar) */
  totalSubsidi: number;
  /** dibayar konsumen */
  dibayar: number;
  /** metode bayar, contoh "CASH" */
  metode: string;
  noPlat: string;
  /** cetak paragraf "Anda mendapat subsidi dari Pemerintah ..." */
  catatanSubsidi: boolean;
  createdAt: string;
}
