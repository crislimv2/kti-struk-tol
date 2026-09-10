import { NextResponse } from "next/server";
import { getLogoBitmaps } from "@/lib/struk/logos";
import { buildHeaderMono, monoKePng } from "@/lib/struk/raster";

/**
 * GET /api/header?logos=jasamarga&sub=...&info=...&ikon=1&lebar=58
 * -> PNG hitam-putih kepala struk persis seperti raster yang dikirim ke printer (untuk pratinjau).
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lebar = u.searchParams.get("lebar") === "80" ? 80 : 58;
  const logos = getLogoBitmaps(
    (u.searchParams.get("logos") ?? "").split(",").filter(Boolean).slice(0, 3),
    lebar,
  );
  const mono = await buildHeaderMono({
    logos,
    subJudul: (u.searchParams.get("sub") ?? "").slice(0, 60),
    infoTol: (u.searchParams.get("info") ?? "").slice(0, 30),
    ikonTelepon: u.searchParams.get("ikon") === "1",
    lebar,
  });
  const png = await monoKePng(mono);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store",
      "x-header-size": `${mono.width}x${mono.height}`,
    },
  });
}
