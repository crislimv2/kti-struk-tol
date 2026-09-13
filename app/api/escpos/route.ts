import { NextResponse } from "next/server";
import { bangunEscPos, namaDokumen, notaValid } from "@/lib/struk/render-nota";

interface Body {
  struk: unknown;
  copies?: number;
  cut?: boolean;
  feed?: number;
}

/**
 * POST /api/escpos -> { ok, data (base64 ESC/POS), bytes, docName }
 * Menerima struk tol maupun struk SPBU (field `jenis: "spbu"`). Dipakai bila web di-host di
 * cloud: byte dibuat di server, lalu browser meneruskannya ke agen cetak lokal di PC pengguna.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Body harus JSON" }, { status: 400 });
  }
  if (!notaValid(body.struk)) {
    return NextResponse.json({ ok: false, message: "Data struk tidak lengkap" }, { status: 400 });
  }
  const payload = await bangunEscPos(body.struk, { copies: body.copies, cut: body.cut, feed: body.feed });
  return NextResponse.json({
    ok: true,
    data: Buffer.from(payload).toString("base64"),
    bytes: payload.length,
    docName: namaDokumen(body.struk),
  });
}
