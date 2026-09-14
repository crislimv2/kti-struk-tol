# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini.

## Apa ini

**KTI Struk Tol**: web app internal Kristal Transport Indonesia untuk mencetak
struk gerbang tol ke printer thermal 80mm (Iware XS-80BT, driver Windows
"POS80"). Dibuat dari template `kti-template-supabase-nextjs` (Next.js 16,
App Router, Tailwind v4, shadcn/ui, Supabase SSR).

Format struk = **format asli 58mm x 30mm** hasil baca 10 foto struk armada (Jun-Jul 2026):
logo raster + sub-judul + Info Tol + nama gerbang + baris tanggal/kode gardu + no seri/kode
trx + (asal gerbang) + `GOL-3 e-Toll BCA  Rp16500` + `CN:... Rp.saldo`. Lihat
`docs/FORMAT-STRUK-TOL.md` bagian 11. Di kertas 80mm blok 58mm dicetak **rapat kiri**
(keputusan owner 2026-09-10). Default golongan **3** (Hino Euro 4 FL260JW, 3 gandar).
Struk tidak mencetak unit/nopol.

Bahasa UI: **Indonesia**. Isi struk: ASCII saja (printer pakai code page PC437).

## Perintah

```bash
npm run dev          # http://localhost:3000
npm run build
npm run start
npm run lint         # eslint flat config (eslint-config-next 16)
npm run typecheck    # tsc --noEmit
npm run print:test   # cetak struk contoh HALIM + logo langsung ke printer, tanpa web (arg: nama printer)
npm run logos:build  # public/logos/*.svg -> lib/struk/logos/*.json (1-bit) + public/logos/mono/*.png (sharp)
npm run fonts:build  # public/fonts/*.ttf -> lib/struk/fonts/*.json (opentype.js, raster kepala)
```

Jangan `npm run build` saat dev server jalan (berbagi `.next/`).

## Arsitektur

```
lib/struk/
  types.ts      StrukData (field struk asli), GayaStruk (7 opsi gaya per mesin gerbang),
                StrukLine (baris hasil render: font A/B, bold, align, kolom kanan), LogoBitmap
  presets.ts    GAYA_PRESETS (halim/transjawa/kunciran/hk), OPERATORS (logoIds, subJudul, infoTol),
                GERBANG_PRESETS (20 gerbang armada -> operator, sistem, gaya, asal), KARTU_PRESETS,
                DEFAULT_GOLONGAN=3, buatKodeGardu/buatNoSeri/buatKodeTrx
  format.ts     renderStruk(data) -> StrukLine[] sesuai foto; formatTarif/formatSaldo/formatCn;
                barisKeTeks() untuk pratinjau teks/riwayat/Supabase; KOLOM {A:32,B:42}
  escpos.ts     buildStrukEscPos(lines, headerRaster) -> Uint8Array: kepala struk GS v 0, semua
                sela header & jarak bawah gerbang via feedDot() = ESC 3 n + LF (n <= 40; nilai
                besar diabaikan). PADDING AKHIR (masih diuji owner 2026-09-10, semua varian
                sebelumnya gagal: ESC d, ESC J, LF, raster putih, raster+titik): sekarang tiga lapis =
                feedDot(120) + raster 1 baris bertitik + GS V 66 n=120 (feed lalu potong). Kalau
                hasilnya berlebih, kurangi salah satu. Margin atas = jarak head-pisau, mekanis.
                Per baris ESC M (font) / GS ! (tinggi ganda),
                perataan tengah & blok 58mm DENGAN SPASI (teksBaris), feed 2, partial cut.
                TANPA GS L / GS W / ESC a / ESC *: di XS-80BT parameter GS W tercetak sebagai
                huruf ("C-cedilla"/"@") dan ESC a diabaikan setelah raster (foto cetak 2026-09-10).
                Baris dengan indentDot/ikonTelepon DILEWATI (sudah ada di raster kepala).
  Font 58mm +50% (owner 2026-09-10): SEMUA baris transaksi Font A (bukan B), teks kepala raster
                1,5x + ikon 29 dot di kedua template. Template 80mm: logo varian "-80" (1,5x),
                gerbang & GOL Font A tinggi ganda; blok transaksi tetap selebar 58mm di tengah.
                Jarak baris global ESC 3 22. (Percobaan sela per baris +6/+9 dot dan tanpa tinggi
                ganda DITOLAK owner 2026-09-10: "jauh lebih jelek", dikembalikan.)
  Driver Windows "POS80 Printer": tab PaperSave memangkas ruang kosong (Middle 10mm, Bottom
                0.13mm default) -> naikkan ke maksimum; tab Cutter "Feed And HalfCut", Feed 10mm.
  Gaya font (samakan dengan foto): gerbang Font A normal, GOL Font A normal (owner: tanpa
                tebal sama sekali), baris lain Font B normal; jarak di bawah gerbang ESC J 36 dot
                (54 di 80mm); feed akhir ESC d 3 (4 di 80mm); sub-judul raster Arial normal + letter-spacing;
                pratinjau memakai Ubuntu Mono (advance 0.5em, mirip font thermal), var --font-thermal.
  raster.ts     (server-only, sharp) buildHeaderMono/buildHeaderRaster: logo + sub-judul (Arial bold
                13px, rata kiri di bawah wordmark, lebar dibatasi selebar wordmark) + baris
                "Info Tol : (ikon) 14080" (Arial 16px) -> satu bitmap. monoKePng untuk pratinjau.
  ikon.ts       IKON_TELEPON 17x17 (gagang telepon diagonal dalam lingkaran).
app/api/header/route.ts  GET ?logos&sub&info&ikon&lebar -> PNG kepala struk (dipakai <img> pratinjau)
  logos/        <id>.json bitmap 1-bit hasil logos:build (+ wordmarkX untuk Jasa Marga).
                Sumber Jasa Marga = foto lockup asli `public/logos/logo struk tol jasa marga.jpg`
                (dari owner, 2026-09-10): `jasamarga` = simbol+wordmark, `jasamarga-ihc` = +tagline
                asli (dipakai operator jm-ihc, subJudul kosong), `ikon-telepon` = ikon 19x19 dari foto;
                index.ts getLogoBitmaps(), LOGO_FILES (png mono). transsumatera = SVG buatan sendiri
                (simbol jalan + teks) karena logo resmi JTTS tidak bisa diunduh
  Lebar kertas  StrukData.lebarKertas 58 | 80 (OperatorPreset.lebarKertas; HK = 80mm penuh).
                LEBAR_DOT {58:384, 80:576}; kolom(font, lebar). Sub-judul dicetak Font B tebal
                rata kiri di bawah wordmark logo (indentDot = logoKiri + wordmarkX), bukan tengah.
                Di 80mm, baris transaksi tetap blok selebar 58mm yang di-center (StrukLine.blok,
                keputusan owner 2026-09-10: "justify center, bukan space-between"); isiBaris().
  storage.ts    riwayat localStorage (key kti-struk-tol-v2) + upsert opsional ke Supabase
app/api/print/route.ts
  GET  -> daftar printer Windows (scripts/list-printers.ps1) + default (env STRUK_PRINTER, default POS80)
  POST -> {struk, printer, copies}: server render + logo -> ESC/POS -> file temp -> scripts/print-raw.ps1
scripts/print-raw.ps1   winspool RAW via P/Invoke (Add-Type C#). Tidak butuh share printer / modul native.
scripts/build-logos.mjs SVG/PNG -> 1-bit (threshold per logo, Jasa Marga: tagline dihapus, lengkung kuning putih)
components/struk/
  struk-app.tsx        state utama, tombol Cetak ESC/POS / Cetak via browser / Simpan, riwayat
  struk-app-loader.tsx next/dynamic ssr:false (default berisi jam & nomor acak -> hindari hydration mismatch)
  struk-form.tsx       pilih gerbang -> terapkanGerbang() isi operator/logo/sub-judul/info tol/gaya/asal;
                       field transaksi, golongan/kartu/tarif/CN/saldo, <details> Gaya cetak
  struk-preview.tsx    replika fisik: kertas 576 dot, blok 384 dot rapat kiri, 1 dot = 0.9px,
                       logo png mono, Font A/B ukuran beda, garis putus batas 58mm
  struk-history.tsx    daftar riwayat: muat, cetak ulang, hapus
public/logos/          svg asli (Wikipedia) + mono/*.png hasil konversi
supabase/migrations/   tabel toll_receipts + RLS per user (opsional)
```

Aturan penting:
- `cacheComponents: true` di next.config: **jangan** pakai `export const dynamic/runtime`
  di route handler; pakai `await connection()` bila perlu dinamis.
- `turbopack.root` di-set ke folder proyek karena ada `package.json` nyasar di
  `C:\Users\Cris` yang membuat Turbopack salah root.
- `proxy.ts` mengecualikan `/api/` dari redirect login agar cetak tetap jalan
  meski Supabase aktif dan user belum login.
- Semua teks struk lewat `bersihkan()` (ASCII) dan dipotong ke lebar kolom font (A 32 / B 42).
- Ubah gaya per gerbang di `GAYA_PRESETS`/`GERBANG_PRESETS`, bukan di form. Tambah gerbang baru =
  satu entri `GERBANG_PRESETS`.
- Logo baru: taruh SVG/PNG di `public/logos/`, tambah entri di `scripts/build-logos.mjs` dan
  `lib/struk/logos/index.ts`, jalankan `npm run logos:build`. Logo Trans Sumatera belum ada.

## Printer

- Windows queue "POS80" (driver ShenZhen Lenon, port POS80-Port) = Iware XS-80BT.
  Cadangan: queue "POS-80C" (driver POS Printer Driver V7.17) tapi port-nya LPT1,
  ganti ke USB001 dulu kalau mau dipakai.
- Installer driver: `C:\Users\Cris\Desktop\Driver Printer XS-80BT\`.
- Jalur cetak utama = ESC/POS RAW (teks tajam, potong otomatis). Jalur cadangan =
  `window.print()` dengan CSS `@page { size: 80mm auto }` di `app/globals.css`.

## Status & langkah berikutnya (per 2026-09-10)

Selesai dan teruji (tsc, eslint, curl API, render headless Edge tanpa error konsol):
form + pratinjau + cetak ESC/POS (font printer + logo raster) + cetak browser + riwayat.
2026-09-10: format diganti ke format asli 58mm dari foto, 20 preset gerbang, logo
Jasa Marga/HK/Waskita. Owner memutuskan: blok rapat kiri, template 32/48 lama dihapus,
tanpa UNIT/NOPOL, default Golongan 3.

Belum dilakukan:
- Cetak fisik pertama 2026-09-10 (foto owner): logo & teks Font A/B tercetak baik, TAPI
  (1) `ESC *` inline tidak didukung -> ikon jadi sampah + huruf "C-cedilla" nyasar + baris pecah,
  (2) Font B tebal dirender lebih lebar -> sub-judul terpotong. Solusi: kepala struk jadi
  satu raster GS v 0 (raster.ts). Jangan pakai ESC * atau Font B bold di printer ini.
  Yang masih perlu dicek di kertas: hasil raster kepala, tinggi blok ~30mm (feed/lineSpacing).
- Logo Trans Sumatera (di samping HK) belum ada file sumber.
- Repo belum `git init` / belum ada commit.
- Supabase belum dikonfigurasi (`.env.local` belum ada); app jalan tanpa itu.
- Ada `package.json` nyasar di `C:\Users\Cris` (deps supabase/minio) yang
  membuat Turbopack salah root; sudah ditangani via `turbopack.root`, tapi
  sebaiknya file itu dihapus/dipindah.

Konteks printer lengkap (driver, installer, queue Windows) ada di bagian
"Printer" di atas dan di `docs/FORMAT-STRUK-TOL.md`.

## Deploy & agen cetak (2026-09-10)

Target: web di Vercel (gratis), dipakai orang lain, printer USB di PC mereka.
- `app/api/escpos/route.ts` POST {struk, copies, cut} -> {data base64}. Jalan di Vercel (sharp OK).
- `public/agent/kti-print-agent.ps1`: server HTTP mini di atas TcpListener 127.0.0.1:9123
  (tanpa URL ACL/admin), CORS `*` + `Access-Control-Allow-Private-Network`, endpoint
  /health /printers /print (winspool RAW, kode sama dengan scripts/print-raw.ps1).
  `install-agent.ps1` salin ke %LOCALAPPDATA%\KTI Struk Tol + Task Scheduler at-logon hidden.
- `lib/struk/agent.ts` klien browser; `struk-app.tsx` mode: agen -> server (win32) -> tidak-ada.
  Halaman panduan: `app/agen/page.tsx` (unduh 3 file dari /agent/*).
- Halaman HTTPS boleh fetch http://127.0.0.1 (origin aman) di Chrome/Edge/Firefox.
- Opsi lokal tetap ada: scripts/prod-build.ps1, prod-start.ps1, install-autostart.ps1
  (build ke .next-prod via env STRUK_DIST_DIR agar tidak bentrok dev).
- VPS tanpa Vercel: `Dockerfile` (node:22-alpine, `output: "standalone"`, apk fontconfig +
  ttf-liberation agar sharp/librsvg punya font Arial-kompatibel untuk raster kepala),
  `docker-compose.yml` (port 3000, restart), `deploy/Caddyfile` (HTTPS). Diuji lokal 2026-09-10:
  image build OK, /api/header & /api/escpos jalan di Linux, /api/print GET mengembalikan kosong
  (platform linux) sehingga UI beralih ke agen.
- Font raster kepala (2026-09-10): TIDAK lagi memakai font sistem. `public/fonts/LiberationSans-*.ttf`
  (OFL, metrik = Arial) -> `npm run fonts:build` -> `lib/struk/fonts/*.json` (base64) ->
  raster.ts memuat via opentype.js, teks jadi path SVG, sharp merender path. Alasan: di Vercel
  /api/header 500 dan di Docker teks hilang karena librsvg tidak menemukan font. Sekarang hasil
  identik di Windows/Docker/Vercel. Dockerfile tidak perlu apk font.
- Pemasangan agen di PC pengguna: SmartScreen/Execution Policy memblokir "Run with PowerShell"
  pada .ps1 unduhan. Solusi: (1) web-installer `public/agent/install.ps1` dijalankan via
  `powershell -ExecutionPolicy Bypass -Command "irm <origin>/agent/install.ps1 | iex"` (halaman
  /agen membuat perintah sesuai domain, tombol salin); (2) launcher `Pasang-Agen-Cetak.cmd`
  (Unblock-File + Bypass). Agen hanya listen loopback -> Windows Firewall tidak prompt.
- Vercel: proyek tertaut (.vercel/, akun crislimv2), deploy `npx vercel --prod --yes`.
  Perbaikan 2026-09-10: `outputFileTracingIncludes` untuk @img/sharp-libvips-linux-x64
  (tanpa itu /api/header & /api/escpos 500: libvips-cpp.so tidak ikut ke bundle).

## Template SPBU Pertamina (2026-09-13)

- `lib/spbu/types.ts` SpbuData (jenis:"spbu"), `presets.ts` SPBU_PRESETS (30 SPBU armada dari daftar
  owner 2026-09-14; kode 8 digit hanya diketahui AH. Nasution 14201147; `noTransContoh` per lokasi
  -> buatNoTrans(contoh) = contoh + acak 0..9999),
  BBM_PRESETS (Bio Solar 6.800/16.555, Pertalite, Dexlite, Dex, Pertamax; harga perkiraan,
  ubah di form), hitungDariVolume/hitungDariDibayar (isi Rp 100.000 -> volume otomatis).
- `lib/spbu/format.ts` renderSpbu -> StrukLine[] Font A 32 kolom; pemisah "- - -" dengan sela
  8 dot; angka ribuan koma (en-US); paragraf subsidi dibungkus rata tengah (bungkusTengah).
- Logo: `public/logos/pertamina.jpg` -> `npm run logos:build` (trim + threshold 200) ->
  `pertamina` 150x35 dot. Kepala SPBU = logo saja (buildHeaderRaster tanpa sub-judul/Info Tol).
- `lib/struk/nota.ts` NotaData = StrukData | SpbuData (adalahSpbu); `lib/struk/render-nota.ts`
  (server-only) bangunEscPos/notaValid/namaDokumen dipakai /api/print & /api/escpos.
- UI: tab "Struk Tol" / "Struk SPBU" di struk-app.tsx, `components/spbu/spbu-form.tsx`,
  riwayat campuran (storage v2 menerima kedua jenis; Supabase hanya tol).
- Format lengkap: docs/FORMAT-STRUK-TOL.md bagian 12.
