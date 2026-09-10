import {
  FEED_BARIS_DEFAULT,
  FEED_DOT_PER_BARIS,
  GAP_SETELAH_HEADER_DOT,
  POSISI_KIRI_DOT,
  barisDiRaster,
  teksBaris,
} from "@/lib/struk/escpos";
import { LEBAR_CHAR, LEBAR_DOT } from "@/lib/struk/format";
import type { LebarKertas, StrukLine } from "@/lib/struk/types";
import { cn } from "@/lib/utils";

interface Props {
  lines: StrukLine[];
  /** URL PNG kepala struk dari /api/header (raster yang sama dengan yang dicetak) */
  headerSrc: string | null;
  lebar: LebarKertas;
  className?: string;
}

/** Skala pratinjau: 1 dot printer = PX px. Kertas printer 80mm = 576 dot. */
const PX = 0.9;
const KERTAS_DOT = 576;
/** Tinggi glyph Font A 24 dot, Font B 17 dot; jarak baris ESC 3 = 22 dot (Font A jadi 24). */
const TINGGI_BARIS = { A: 24, B: 22 } as const;

function Baris({ line, lebar }: { line: StrukLine; lebar: LebarKertas }) {
  if (line.kosong && line.tinggiDot) {
    return <span className="block" style={{ height: line.tinggiDot * PX }} aria-hidden />;
  }
  const fontSize = (LEBAR_CHAR[line.font] * PX) / 0.5; // Ubuntu Mono: lebar glyph 0.5em
  const tinggi = TINGGI_BARIS[line.font] * PX * (line.tinggiGanda ? 2 : 1);
  const style: React.CSSProperties = {
    fontSize,
    lineHeight: `${TINGGI_BARIS[line.font] * PX}px`,
    height: tinggi,
    letterSpacing: 0,
    // tinggi ganda (GS ! 0x01): glyph diregang vertikal 2x, lebar tetap
    transform: line.tinggiGanda ? "scaleY(2)" : undefined,
    transformOrigin: "top left",
  };
  const text = teksBaris(line, lebar);
  return (
    <span
      className={cn("block whitespace-pre", line.bold && "font-bold")}
      style={line.tinggiGanda ? { height: tinggi } : undefined}
    >
      <span className="block" style={style}>
        {text || " "}
      </span>
    </span>
  );
}

/** Kertas printer 80mm dengan blok struk (58mm atau 80mm penuh) rapat kiri, sama seperti hasil cetak. */
export function StrukPreview({ lines, headerSrc, lebar, className }: Props) {
  const lebarDot = LEBAR_DOT[lebar];
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative max-w-full overflow-x-auto">
        <div className="paper-edge paper-edge-top" aria-hidden />
        <div
          className="paper relative"
          style={{
            width: KERTAS_DOT * PX,
            paddingTop: 10 * PX,
            // padding bawah = feed sebelum potong (~15mm), sama seperti hasil cetak
            paddingBottom: FEED_BARIS_DEFAULT * FEED_DOT_PER_BARIS * PX,
          }}
        >
          <div className="text-neutral-900" style={{ marginLeft: POSISI_KIRI_DOT * PX, width: lebarDot * PX }}>
            {headerSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerSrc}
                alt="kepala struk"
                className="block"
                style={{
                  width: lebarDot * PX,
                  imageRendering: "pixelated",
                  marginBottom: GAP_SETELAH_HEADER_DOT * PX,
                }}
              />
            )}
            <div className="font-mono" style={{ fontFamily: "var(--font-thermal), 'Ubuntu Mono', monospace" }}>
              {lines
                .filter((l) => !barisDiRaster(l))
                .map((line, i) => (
                  <Baris key={i} line={line} lebar={lebar} />
                ))}
            </div>
          </div>
          {lebarDot < KERTAS_DOT && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 border-l border-dashed border-neutral-300"
              style={{ left: (POSISI_KIRI_DOT + lebarDot) * PX }}
              title="batas 58mm"
            />
          )}
        </div>
        <div className="paper-edge paper-edge-bottom" aria-hidden />
      </div>
    </div>
  );
}
