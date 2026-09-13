import { connection, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { bangunEscPos, namaDokumen, notaValid } from "@/lib/struk/render-nota";
import type { PrinterInfo, PrintResult } from "@/lib/struk/types";

const execFileAsync = promisify(execFile);
const SCRIPTS = path.join(process.cwd(), "scripts");
const DEFAULT_PRINTER = process.env.STRUK_PRINTER ?? "POS80";

function powershell(args: string[]) {
  return execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", ...args],
    { windowsHide: true, timeout: 30_000, maxBuffer: 1024 * 1024 },
  );
}

/** GET /api/print -> daftar printer Windows + printer default */
export async function GET() {
  await connection(); // selalu dinamis: daftar printer dibaca saat request, bukan saat build
  if (process.platform !== "win32") {
    return NextResponse.json({ printers: [], default: DEFAULT_PRINTER, platform: process.platform });
  }
  try {
    const { stdout } = await powershell(["-File", path.join(SCRIPTS, "list-printers.ps1")]);
    const parsed = JSON.parse(stdout.trim() || "[]");
    const printers: PrinterInfo[] = (Array.isArray(parsed) ? parsed : [parsed]).map((p) => ({
      name: String(p.name ?? ""),
      port: String(p.port ?? ""),
      status: String(p.status ?? ""),
    }));
    return NextResponse.json({ printers, default: DEFAULT_PRINTER, platform: "win32" });
  } catch (err) {
    return NextResponse.json(
      { printers: [], default: DEFAULT_PRINTER, error: (err as Error).message },
      { status: 500 },
    );
  }
}

interface PrintBody {
  struk: unknown;
  printer?: string;
  copies?: number;
  cut?: boolean;
  feed?: number;
}

/** POST /api/print -> render struk di server, kirim ESC/POS RAW ke printer */
export async function POST(req: Request) {
  let body: PrintBody;
  try {
    body = (await req.json()) as PrintBody;
  } catch {
    return NextResponse.json<PrintResult>({ ok: false, message: "Body harus JSON" }, { status: 400 });
  }
  if (!notaValid(body.struk)) {
    return NextResponse.json<PrintResult>({ ok: false, message: "Data struk tidak lengkap" }, { status: 400 });
  }
  const printer = (body.printer || DEFAULT_PRINTER).trim();
  const copies = Math.min(Math.max(Number(body.copies) || 1, 1), 5);
  if (!/^[\w .()\-\\]+$/.test(printer)) {
    return NextResponse.json<PrintResult>({ ok: false, message: "Nama printer tidak valid" }, { status: 400 });
  }
  if (process.platform !== "win32") {
    return NextResponse.json<PrintResult>(
      { ok: false, message: "Cetak RAW hanya didukung di Windows (server harus jalan di PC yang tersambung printer)" },
      { status: 501 },
    );
  }

  const payload = await bangunEscPos(body.struk, { copies, cut: body.cut, feed: body.feed });

  const dir = await mkdtemp(path.join(tmpdir(), "struk-tol-"));
  const file = path.join(dir, "job.bin");
  try {
    await writeFile(file, payload);
    const { stdout } = await powershell([
      "-File",
      path.join(SCRIPTS, "print-raw.ps1"),
      "-Printer",
      printer,
      "-File",
      file,
      "-DocName",
      namaDokumen(body.struk),
    ]);
    const result = JSON.parse(stdout.trim() || "{}");
    return NextResponse.json<PrintResult>({
      ok: true,
      message: `Terkirim ke ${printer} (${result.bytes ?? payload.length} byte, ${copies} salinan)`,
      printer,
      bytes: Number(result.bytes ?? payload.length),
    });
  } catch (err) {
    const e = err as Error & { stdout?: string };
    let message = e.message;
    try {
      const parsed = JSON.parse((e.stdout ?? "").trim());
      if (parsed?.message) message = String(parsed.message);
    } catch {
      /* stdout bukan JSON, pakai pesan asli */
    }
    return NextResponse.json<PrintResult>({ ok: false, message, printer }, { status: 500 });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
