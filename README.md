# KTI Struk Tol

Aplikasi web untuk mencetak struk gerbang tol ke printer thermal 80mm
(Iware XS-80BT) dari PC Windows. Default kendaraan: Hino Euro 4 FL260JW,
Golongan III.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Server harus berjalan di PC yang tersambung ke
printer, karena pencetakan memakai spooler Windows (queue `POS80`).

## Fitur

- Format struk asli 58mm x 30mm (dari foto struk armada): logo operator, Info Tol,
  gerbang, tanggal + kode gardu, no seri + kode transaksi, asal gerbang, baris
  `GOL-3 e-Toll BCA Rp16500`, baris `CN:... Rp.saldo`.
- 20 preset gerbang: Halim, Meruya Utama 2, Cikarang Barat 5, Sentul 2, Cimanggis 5,
  Cikunir 4 New, Kanci, Mabar 2, Cikampek Utama 1/2, Kandeman, Bekasi Barat 1,
  Kunciran 4, Benda Utama 4, Pekanbaru, HK-KAU, Lambu Kibang 6, Bakauheni Selatan,
  Gunung Sugih, Kramasan. Tiap preset membawa logo, sub-judul, Info Tol, dan gaya
  penulisan mesin gerbangnya.
- Logo Jasa Marga, Hutama Karya, Waskita sebagai bitmap 1-bit (`npm run logos:build`).
- Golongan default 3 (Hino Euro 4 FL260JW); kartu default e-Toll BCA.
- Pratinjau replika fisik kertas 80mm dengan blok 58mm rapat kiri.
- Cetak ESC/POS: font bawaan printer + logo raster, potong otomatis. Cadangan: cetak via
  dialog browser (tanpa logo).
- Riwayat di browser (localStorage). Opsional: sinkron ke Supabase
  (`supabase/migrations/20260908000000_toll_receipts.sql`).

## Tes printer tanpa web

```bash
npm run print:test            # ke printer POS80
npm run print:test -- POS-80C # ke printer lain
```

## Konfigurasi

Salin `.env.example` ke `.env.local`. `STRUK_PRINTER` mengubah printer default.
Variabel Supabase hanya perlu jika ingin login dan riwayat lintas perangkat.

## Deploy untuk pengguna lain (web di Vercel + agen cetak di PC pengguna)

Printer USB ada di komputer pengguna, jadi server tidak mencetak. Alurnya:
web (Vercel) membuat byte ESC/POS lewat `POST /api/escpos`, browser meneruskannya
ke **agen cetak lokal** (`public/agent/kti-print-agent.ps1`, PowerShell, tanpa
dependensi) yang berjalan di `http://127.0.0.1:9123` di PC pengguna dan menulis
ke printer Windows lewat winspool RAW.

1. Deploy web: `npx vercel` (login sekali), lalu `npx vercel --prod`. Tidak perlu
   env apa pun; Supabase opsional. Endpoint `/api/print` (PowerShell) otomatis
   tidak aktif di Linux dan UI beralih ke agen.
2. Di PC pengguna: buka `https://<domain>/agen`, unduh tiga file, klik kanan
   `install-agent.ps1` > Run with PowerShell. Agen terdaftar di Task Scheduler
   (jalan saat logon, tanpa jendela) dan langsung hidup.
3. Muat ulang web: printer pengguna tampil di daftar, tombol Cetak ESC/POS
   mengirim ke agen.

Alternatif tanpa cloud: jalankan di PC printer sendiri
(`npm run prod:build`, `npm run prod:start`, `npm run autostart:install`) dan
akses lewat IP LAN.
