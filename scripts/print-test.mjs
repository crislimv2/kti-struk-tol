// Tes printer tanpa menjalankan web: node scripts/print-test.mjs [NamaPrinter]
// Mengirim struk contoh HALIM (Gol-3 e-Toll BCA Rp16500) + logo Jasa Marga
// lewat scripts/print-raw.ps1. Builder ESC/POS di sini adalah salinan ringkas
// dari lib/struk/escpos.ts supaya skrip ini bisa jalan tanpa TypeScript.
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const printer = process.argv[2] || process.env.STRUK_PRINTER || "POS80";
const ESC = 0x1b, GS = 0x1d;
const LEBAR = 384;

const logo = JSON.parse(readFileSync(path.join(process.cwd(), "lib/struk/logos/jasamarga.json"), "utf8"));

const out = [];
const push = (...b) => out.push(...b);
const txt = (s) => { for (const ch of s) push(ch.charCodeAt(0) & 0x7f); };

push(ESC, 0x40, ESC, 0x74, 0x00);
// GS L / GS W sengaja tidak dipakai (parameter tercetak sebagai huruf di XS-80BT)
push(ESC, 0x33, 22);

// logo, rata tengah dalam 384 dot
{
  const buf = Buffer.from(logo.data, "base64");
  const bpr = Math.ceil(LEBAR / 8);
  const pad = Math.floor((LEBAR - logo.width) / 2);
  const raster = Buffer.alloc(bpr * logo.height, 0);
  for (let y = 0; y < logo.height; y++)
    for (let x = 0; x < logo.width; x++) {
      const bit = (buf[y * logo.bytesPerRow + (x >> 3)] >> (7 - (x & 7))) & 1;
      if (bit) raster[y * bpr + ((pad + x) >> 3)] |= 0x80 >> ((pad + x) & 7);
    }
  push(GS, 0x76, 0x30, 0x00, bpr & 0xff, bpr >> 8, logo.height & 0xff, logo.height >> 8, ...raster);
}

const line = (s, { font = "B", bold = false, center = false } = {}) => {
  push(ESC, 0x4d, font === "A" ? 0 : 1, ESC, 0x45, bold ? 1 : 0, ESC, 0x61, center ? 1 : 0);
  txt(s); push(0x0a);
};
const dua = (l, r, w) => l + " ".repeat(Math.max(1, w - l.length - r.length)) + r;

// Tes koneksi saja: sub-judul & Info Tol di sini teks biasa (tanpa ikon). Di aplikasi,
// kepala struk dikirim sebagai satu raster GS v 0 (lib/struk/raster.ts) karena printer
// XS-80BT tidak mendukung ESC * inline dan Font B tebal melebar.
line("Indonesia Highway Corporation", { center: true });
line("Info Tol : 14080", { center: true });
line("HALIM", { font: "A", bold: true, center: true });
line("");
line(dua("14/07/2026 19:58:40", "09/03/03", 42));
line(dua("No seri :052462", "008422/250033", 42));
line(dua("GOL-3 e-Toll BCA", "Rp16500", 32), { font: "A", bold: true });
line("CN:0145202401284656 Rp.81820");
push(ESC, 0x45, 0, ESC, 0x4d, 0, ESC, 0x32, ESC, 0x64, 2, GS, 0x56, 0x42, 0x00);

const dir = mkdtempSync(path.join(tmpdir(), "struk-test-"));
const file = path.join(dir, "job.bin");
writeFileSync(file, Buffer.from(out));
const script = path.join(process.cwd(), "scripts", "print-raw.ps1");
execFile(
  "powershell.exe",
  ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, "-Printer", printer, "-File", file, "-DocName", "Tes Struk Tol"],
  { windowsHide: true },
  (err, stdout, stderr) => {
    rmSync(dir, { recursive: true, force: true });
    console.log(stdout.trim() || stderr.trim() || (err && err.message));
    process.exit(err ? 1 : 0);
  },
);
