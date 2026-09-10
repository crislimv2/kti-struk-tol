import { NextResponse } from "next/server";
import { buildStrukEscPos } from "@/lib/struk/escpos";
import { renderStruk } from "@/lib/struk/format";
import { getLogoBitmaps } from "@/lib/struk/logos";
import { findOperator } from "@/lib/struk/presets";
import { buildHeaderRaster } from "@/lib/struk/raster";
import type { StrukData } from "@/lib/struk/types";

interface Body {
  struk: StrukData;
  copies?: number;
  cut?: boolean;
  feed?: number;
}

function strukValid(s: unknown): s is StrukData {
  if (!s || typeof s !== "object") return false;
  const d = s as Partial<StrukData>;
  return (
    typeof d.gerbang === "string" &&
    typeof d.tanggal === "string" &&
    typeof d.gaya === "object" &&
    d.gaya !== null &&
    Array.isArray(d.logoIds)
  );
}

/**
 * POST /api/escpos -> { ok, data (base64 ESC/POS), bytes, docName }
 * Dipakai bila web di-host di cloud (Vercel): byte dibuat di server, lalu browser
 * meneruskannya ke agen cetak lokal (public/agent/kti-print-agent.ps1) di PC pengguna.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Body harus JSON" }, { status: 400 });
  }
  if (!strukValid(body.struk)) {
    return NextResponse.json({ ok: false, message: "Data struk tidak lengkap" }, { status: 400 });
  }
  const copies = Math.min(Math.max(Number(body.copies) || 1, 1), 5);
  const lebar = body.struk.lebarKertas === 80 ? 80 : 58;
  const logos = getLogoBitmaps(body.struk.logoIds.slice(0, 3), lebar);
  const lines = renderStruk(body.struk, logos);
  const header = await buildHeaderRaster({
    logos,
    subJudul: body.struk.subJudul ?? "",
    infoTol: body.struk.infoTol ?? "",
    ikonTelepon: findOperator(body.struk.operatorId).ikonTelepon,
    lebar,
  });
  const single = buildStrukEscPos(lines, header, { lebar, cut: body.cut ?? true, feed: body.feed });
  const payload = new Uint8Array(single.length * copies);
  for (let i = 0; i < copies; i++) payload.set(single, i * single.length);

  return NextResponse.json({
    ok: true,
    data: Buffer.from(payload).toString("base64"),
    bytes: payload.length,
    docName: `Struk Tol ${body.struk.gerbang} ${body.struk.noSeri ?? ""}`.slice(0, 60),
  });
}
