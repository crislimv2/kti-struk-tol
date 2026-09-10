import ikonJson from "./logos/ikon-telepon.json";
import ikonJson80 from "./logos/ikon-telepon-80.json";
import type { LebarKertas } from "./types";

/**
 * Ikon telepon dalam lingkaran, dipotong dari foto lockup struk Jasa Marga asli
 * (public/logos/logo struk tol jasa marga.jpg) oleh `npm run logos:build`;
 * 19 dot untuk 58mm, 28 dot untuk 80mm. Dipakai di raster kepala struk
 * (lib/struk/raster.ts); TIDAK dikirim sebagai ESC * karena printer XS-80BT tidak mendukungnya.
 */
interface BitmapJson {
  width: number;
  height: number;
  bytesPerRow: number;
  data: string;
}

/** base64 -> byte, jalan di Node maupun browser. */
function base64KeByte(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function keBaris(j: BitmapJson): string[] {
  const bytes = base64KeByte(j.data);
  const rows: string[] = [];
  for (let y = 0; y < j.height; y++) {
    let r = "";
    for (let x = 0; x < j.width; x++) {
      const bit = (bytes[y * j.bytesPerRow + (x >> 3)] >> (7 - (x & 7))) & 1;
      r += bit ? "X" : ".";
    }
    rows.push(r);
  }
  return rows;
}

/** Baris bitmap: "X" = hitam, "." = putih. */
export const IKON_TELEPON: readonly string[] = keBaris(ikonJson as BitmapJson);
export const IKON_TELEPON_80: readonly string[] = keBaris(ikonJson80 as BitmapJson);

export function ikonTelepon(lebar: LebarKertas): readonly string[] {
  return lebar === 80 ? IKON_TELEPON_80 : IKON_TELEPON;
}
