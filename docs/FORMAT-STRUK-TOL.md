# Format Struk Gerbang Tol Indonesia (2024–2026)

Referensi untuk proyek cetak nota tol di printer thermal 80mm (Iware XS-80BT,
driver Windows: printer "POS80" / "POS-80C").

## 1. Fakta penting sebelum mendesain

| Hal | Keterangan |
|---|---|
| Lebar kertas asli gerbang tol | 57–58mm (32 kolom Font A). Printer kita 80mm = 48 kolom Font A, 64 kolom Font B |
| Kebijakan 2025–2026 | Struk fisik mulai dihapus. Tol Makassar: GTO tanpa struk sejak 17 Ags 2025, semua gardu sejak 17 Ags 2026. Jasa Marga: struk fisik hanya di gardu tertentu, sisanya "resi digital" via app Travoy / astratol.co.id |
| Sistem terbuka | Bayar saat masuk/keluar satu gerbang, tarif flat. Struk TIDAK ada baris ASAL |
| Sistem tertutup | Tap masuk, bayar saat keluar sesuai jarak. Struk ADA baris ASAL (gerbang masuk) |
| PPN | Tarif yang tercetak sudah termasuk PPN (11% s.d. 2024, 12% mulai 2025) |

## 2. Isi struk resmi (urutan sesuai penjelasan Jasa Marga)

1. Nama badan usaha jalan tol (BUJT) / cabang / operator
2. Nama gerbang tol (GT)
3. Tanggal dan jam transaksi
4. Nomor transaksi
5. Nomor gardu, shift, periode
6. ID petugas (CS / supervisor)
7. Golongan kendaraan
8. Asal gerbang (hanya sistem tertutup)
9. Tarif tol (Rp)
10. Jenis kartu e-toll (bank) dan nomor kartu (sebagian disamarkan)
11. Sisa saldo e-toll
12. Footer: ucapan terima kasih, catatan PPN, call center (Jasa Marga 14080, Astra 1500-135 / 0800-1-777-879)

## 3. Golongan kendaraan

| Gol | Kendaraan |
|---|---|
| I | Sedan, jip, pick-up, truk kecil, bus |
| II | Truk 2 gandar |
| III | Truk 3 gandar |
| IV | Truk 4 gandar |
| V | Truk 5 gandar atau lebih |
| VI | Sepeda motor (hanya Bali Mandara & Suramadu) |

## 4. Prefix nomor kartu e-toll (untuk data dummy yang realistis)

| Kartu | Label di struk | Awalan | Digit |
|---|---|---|---|
| Mandiri e-Money / e-Toll | E-MONEY MANDIRI / MANDIRI | 6032 98 | 16 |
| BCA Flazz | BCA FLAZZ / FLAZZ | 0145 | 16 |
| BNI TapCash | BNI TAPCASH | 2028 | 16 |
| BRI Brizzi | BRI BRIZZI | 6013 50 | 16 |
| BTN Blink | BTN BLINK | 6011 | 16 |

Nomor biasanya dicetak penuh 16 digit dipisah 4-4-4-4, sebagian operator menyamarkan 4 digit tengah.

## 5. Template A — Sistem terbuka (Jasa Marga, dalam kota)

Lebar 32 kolom (meniru kertas 57mm). Di kertas 80mm bisa dicetak apa adanya
(rata kiri) atau di-center.

```
    PT JASA MARGA (PERSERO) TBK
     CABANG JAKARTA - CIKAMPEK
      GT CIKARANG UTAMA
--------------------------------
GARDU  : 12        SHIFT : 2
TGL    : 08/09/26  JAM   : 14:32:10
NO.TRX : 0012345678
GOL    : I
TARIF  : Rp.          27.000
KARTU  : E-MONEY MANDIRI
NO.KRT : 6032 9801 2345 6789
SALDO  : Rp.         158.000
PTGS   : 4321
--------------------------------
   TERIMA KASIH, SELAMAT JALAN
   TARIF SUDAH TERMASUK PPN
      CALL CENTER 14080
```

## 6. Template B — Sistem tertutup (Trans Jawa / JTT)

```
   PT JASAMARGA TRANSJAWA TOL
      GT KALIKANGKUNG
--------------------------------
TGL    : 08/09/26  JAM   : 21:05:44
GARDU  : 05        SHIFT : 3
NO.TRX : 2026090800123456
ASAL   : GT CIKAMPEK UTAMA
GOL    : II
TARIF  : Rp.         546.000
KARTU  : BCA FLAZZ
NO.KRT : 0145 XXXX XXXX 7788
SALDO  : Rp.          54.000
PTGS   : 0078
--------------------------------
  SIMPAN STRUK INI SEBAGAI
      BUKTI PEMBAYARAN
   TARIF SUDAH TERMASUK PPN
```

## 7. Template C — Astra Infra (Tangerang–Merak, Cipali)

```
     ASTRA INFRA TOLL ROAD
      TANGERANG - MERAK
        GT CIKUPA
--------------------------------
TANGGAL : 08/09/2026  21:05:44
GARDU   : 03    PETUGAS : 1122
NO.TRX  : 206078
GOLONGAN: I
TARIF   : Rp. 8.500
KARTU   : MANDIRI E-MONEY
NO KARTU: 6032980123456789
SALDO   : Rp. 91.500
--------------------------------
    TERIMA KASIH ATAS
      KUNJUNGAN ANDA
  CS 24 JAM : 0800-1-777-879
```

## 8. Template D — Lebar penuh 48 kolom (memanfaatkan kertas 80mm)

```
================================================
          PT JASA MARGA (PERSERO) TBK
           CABANG JAKARTA - CIKAMPEK
             GT CIKARANG UTAMA
================================================
TANGGAL : 08/09/2026          JAM   : 14:32:10
GARDU   : 12                  SHIFT : 2
NO. TRX : 0012345678          PTGS  : 4321
------------------------------------------------
GOLONGAN                                      I
TARIF TOL                          Rp.   27.000
------------------------------------------------
KARTU        : E-MONEY MANDIRI
NO. KARTU    : 6032 9801 2345 6789
SISA SALDO                         Rp.  158.000
================================================
           TERIMA KASIH, SELAMAT JALAN
           TARIF SUDAH TERMASUK PPN
              CALL CENTER 14080
```

## 9. Contoh tarif Golongan I 2026 (dari media, cek BPJT untuk resmi)

| Ruas | Gol I |
|---|---|
| Jakarta–Tangerang | Rp 8.500 |
| Jakarta–Cikampek | Rp 27.000 |
| Cikampek–Palimanan (Cipali) | Rp 132.000 |
| Semarang–Solo | Rp 92.000 |
| Solo–Ngawi | Rp 163.500 |
| Total Jakarta–Semarang | ± Rp 467.500–473.500 |
| Total Jakarta–Solo | ± Rp 565.500 |
| Total Jakarta–Surabaya | ± Rp 986.500 |

Tarif Gol II–V tidak dimuat lengkap oleh media. Rasio umum: Gol II ≈ 1,5x,
Gol III ≈ 1,5x, Gol IV ≈ 2x, Gol V ≈ 2x dari Gol I (bervariasi per ruas).
Sumber resmi: bpjt.pu.go.id → Tarif Tol.

## 10. Catatan ESC/POS untuk XS-80BT

- Init: `ESC @` (1B 40). Center: `ESC a 1`. Kiri: `ESC a 0`.
- Bold: `ESC E 1` / `ESC E 0`. Double tinggi+lebar: `GS ! 0x11`.
- Font A (12x24) = 48 kolom di 80mm; Font B (9x17, `ESC M 1`) = 64 kolom.
- Feed + potong: `ESC d 4` lalu `GS V 66 0` (partial cut).
- Kirim RAW ke spooler Windows: printer "POS80", datatype RAW.
  Di Node: `node-thermal-printer` (interface `printer:POS80`) atau tulis
  langsung via `\.\USB001`-style port menggunakan modul `printer`/`@thiagoelg/node-printer`.
- Kalau ingin meniru struk tol asli: cetak 32 kolom, rata kiri, Font A,
  tanpa bold, lalu potong. Kertas 80mm yang dipotong akan tampak lebar,
  jadi alternatifnya pakai Font A dengan `ESC a 1` (center) untuk tiap baris.

## 11. Format ASLI dari foto struk armada KTI (Jun-Jul 2026) - dipakai aplikasi

Kertas asli 58mm x 30mm. Di printer 80mm dicetak rapat kiri (area 384 dot), sisa 22mm kosong.

```
[LOGO simbol + wordmark]            bitmap, tengah
Indonesia Highway Corporation       Font B tengah  (TRANSJAWA TOL / KUNCIRAN CENGKARENG / PT HUTAMA KARYA (PERSERO) / SRIWIJAYATOL)
Info Tol : 14080                    Font B tengah  (133 / 0813 2900 0020 / 0711-5641470)
HALIM                               Font A tebal tengah

14/07/2026 19:58:40        09/03/03 Font B, kanan = kode gardu
No seri :052462      008422/250033  Font B, kanan = kode transaksi
Asal Gerbang : 41 [JAPEK OPEN]      hanya sistem tertutup (varian: Asal GB : KUNCIRAN 5)
GOL-3 e-Toll BCA           Rp16500  Font A tebal, kanan = tarif
CN:0145202401284656 Rp.81820        Font B
HARAP SEGERA ISI ULANG.             bila saldo rendah
```

Gaya per mesin gerbang (lib/struk/presets.ts GAYA_PRESETS):

| Gaya | Seri | Kode | Asal | Gol | Kartu | Tarif | CN | Contoh foto |
|---|---|---|---|---|---|---|---|---|
| halim | No seri : | / | Asal Gerbang : | GOL- | e-Toll BCA | Rp16500 | utuh | Halim, Cikunir 4 New, Bekasi Barat 1 |
| transjawa | Seri: | - | Asal Gerbang : | Gol- | e-Toll BCA | 40500 | utuh | Cikampek Utama 1, Mabar 2, Kramasan |
| kunciran | No Seri : | / | Asal GB : | GOL- | E-TOLL BCA | Rp 33.500 | utuh | Benda Utama 4 |
| hk | Seri: | - | Asal Gerbang : | Gol- | e-Toll BCA | Rp22000 | tanpa 0 depan | Pekanbaru, HK-KAU |

Gerbang preset (GERBANG_PRESETS): HALIM, MERUYA UTAMA 2, CIKARANG BARAT 5, SENTUL 2, CIMANGGIS 5,
CIKUNIR 4 NEW, KANCI, MABAR 2 (Jasa Marga IHC); CIKAMPEK UTAMA 1/2, KANDEMAN, BEKASI BARAT 1
(Transjawa Tol); KUNCIRAN 4, BENDA UTAMA 4 (Kunciran Cengkareng); PEKANBARU, HK-KAU,
LAMBU KIBANG 6, BAKAUHENI SELATAN, GUNUNG SUGIH (Hutama Karya); KRAMASAN (Waskita).

Logo: public/logos/*.svg (Wikipedia: Jasa_Marga_logo.svg, Hutama_Karya.svg, Waskita_Karya.svg)
-> `npm run logos:build` -> lib/struk/logos/*.json (1-bit untuk ESC/POS) + public/logos/mono/*.png
(pratinjau). Logo Trans Sumatera belum ada sumber bersih (situs Hutama Karya memblokir unduhan),
jadi struk HK hanya memakai logo HK.

### Koreksi dari crop header (2026-09-10)

- Sub-judul (TRANSJAWA TOL, KUNCIRAN CENGKARENG, Indonesia Highway Corporation,
  PT HUTAMA KARYA (PERSERO)) dicetak kecil-tebal **tepat di bawah wordmark** logo, rata kiri
  dengan awal wordmark, bukan di tengah kertas.
- Info Tol memakai ikon telepon-lingkaran (gagang diagonal) sebelum nomor: Jasa Marga, JTT,
  Kunciran, Hutama Karya. Pekanbaru: Info Tol 0821 7608 8880 (HK-KAU: 0813 2900 0020).
- Struk Hutama Karya dicetak di kertas **80mm penuh** (logo HK kiri + Trans Sumatera kanan),
  bukan 58mm. Struk Jasa Marga & Waskita tetap 58mm.
