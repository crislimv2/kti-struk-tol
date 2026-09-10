// Ubah TTF di public/fonts menjadi modul JSON (base64) agar font ikut ter-bundle ke server
// (Vercel/Docker) tanpa bergantung font sistem. Dipakai lib/struk/raster.ts lewat opentype.js.
// Jalankan: npm run fonts:build
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "fonts");
const OUT = path.join(ROOT, "lib", "struk", "fonts");
mkdirSync(OUT, { recursive: true });

const FONTS = [
  { id: "regular", file: "LiberationSans-Regular.ttf" },
  { id: "bold", file: "LiberationSans-Bold.ttf" },
];

for (const f of FONTS) {
  const buf = readFileSync(path.join(SRC, f.file));
  writeFileSync(
    path.join(OUT, `${f.id}.json`),
    JSON.stringify({ id: f.id, file: f.file, data: buf.toString("base64") }),
  );
  console.log(`${f.id}: ${f.file} (${buf.length} byte)`);
}
