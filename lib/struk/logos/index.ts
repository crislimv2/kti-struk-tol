import type { LebarKertas, LogoBitmap } from "../types";
import jasamarga from "./jasamarga.json";
import jasamarga80 from "./jasamarga-80.json";
import jasamargaIhc from "./jasamarga-ihc.json";
import jasamargaIhc80 from "./jasamarga-ihc-80.json";
import hutamakarya from "./hutamakarya.json";
import hutamakarya80 from "./hutamakarya-80.json";
import transsumatera from "./transsumatera.json";
import transsumatera80 from "./transsumatera-80.json";
import waskita from "./waskita.json";
import waskita80 from "./waskita-80.json";

/**
 * Bitmap logo 1-bit hasil `npm run logos:build` (scripts/build-logos.mjs).
 * Sumber asli di public/logos/. Versi "-80" = 1,5x untuk template kertas 80mm.
 */
const LOGOS: Record<string, LogoBitmap> = {
  jasamarga: jasamarga as LogoBitmap,
  "jasamarga-80": jasamarga80 as LogoBitmap,
  "jasamarga-ihc": jasamargaIhc as LogoBitmap,
  "jasamarga-ihc-80": jasamargaIhc80 as LogoBitmap,
  hutamakarya: hutamakarya as LogoBitmap,
  "hutamakarya-80": hutamakarya80 as LogoBitmap,
  transsumatera: transsumatera as LogoBitmap,
  "transsumatera-80": transsumatera80 as LogoBitmap,
  waskita: waskita as LogoBitmap,
  "waskita-80": waskita80 as LogoBitmap,
};

/** PNG hitam-putih hasil konversi (public/logos/mono), dipakai pratinjau agar sama dengan cetakan. */
export const LOGO_FILES: Record<string, string> = Object.fromEntries(
  Object.keys(LOGOS).map((id) => [id, `/logos/mono/${id}.png`]),
);

/** Ambil bitmap sesuai lebar kertas: 80mm memakai varian "-80" bila ada. */
export function getLogoBitmap(id: string, lebar: LebarKertas = 58): LogoBitmap | null {
  if (lebar === 80) return LOGOS[`${id}-80`] ?? LOGOS[id] ?? null;
  return LOGOS[id] ?? null;
}

export function getLogoBitmaps(ids: string[], lebar: LebarKertas = 58): LogoBitmap[] {
  return ids.map((id) => getLogoBitmap(id, lebar)).filter((l): l is LogoBitmap => l !== null);
}
