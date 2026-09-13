import "server-only";
import { renderSpbu } from "@/lib/spbu/format";
import { buildStrukEscPos } from "./escpos";
import { renderStruk } from "./format";
import { getLogoBitmaps } from "./logos";
import { adalahSpbu, type NotaData } from "./nota";
import { findOperator } from "./presets";
import { buildHeaderRaster } from "./raster";
import type { LebarKertas } from "./types";

/** Logo yang dipakai kepala struk SPBU. */
export const LOGO_SPBU = ["pertamina"];

export function notaValid(n: unknown): n is NotaData {
  if (!n || typeof n !== "object") return false;
  const o = n as Record<string, unknown>;
  if (o.jenis === "spbu") {
    return typeof o.nama === "string" && typeof o.waktu === "string" && typeof o.jenisBbm === "string";
  }
  return (
    typeof o.gerbang === "string" &&
    typeof o.tanggal === "string" &&
    typeof o.gaya === "object" &&
    o.gaya !== null &&
    Array.isArray(o.logoIds)
  );
}

/** Nama dokumen di spooler. */
export function namaDokumen(n: NotaData): string {
  return (adalahSpbu(n)
    ? `Struk SPBU ${n.nama} ${n.noTrans ?? ""}`
    : `Struk Tol ${n.gerbang} ${n.noSeri ?? ""}`
  ).slice(0, 60);
}

/** Render nota apa pun (tol / SPBU) menjadi byte ESC/POS lengkap dengan kepala raster. */
export async function bangunEscPos(
  n: NotaData,
  opts: { copies?: number; cut?: boolean; feed?: number } = {},
): Promise<Uint8Array> {
  const copies = Math.min(Math.max(Number(opts.copies) || 1, 1), 5);
  let single: Uint8Array;
  if (adalahSpbu(n)) {
    const lebar: LebarKertas = 58;
    const logos = getLogoBitmaps(LOGO_SPBU, lebar);
    const header = await buildHeaderRaster({ logos, subJudul: "", infoTol: "", ikonTelepon: false, lebar });
    single = buildStrukEscPos(renderSpbu(n), header, { lebar, cut: opts.cut ?? true, feed: opts.feed });
  } else {
    const lebar: LebarKertas = n.lebarKertas === 80 ? 80 : 58;
    const logos = getLogoBitmaps(n.logoIds.slice(0, 3), lebar);
    const header = await buildHeaderRaster({
      logos,
      subJudul: n.subJudul ?? "",
      infoTol: n.infoTol ?? "",
      ikonTelepon: findOperator(n.operatorId).ikonTelepon,
      lebar,
    });
    single = buildStrukEscPos(renderStruk(n, logos), header, { lebar, cut: opts.cut ?? true, feed: opts.feed });
  }
  const payload = new Uint8Array(single.length * copies);
  for (let i = 0; i < copies; i++) payload.set(single, i * single.length);
  return payload;
}
