"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { renderSpbu } from "@/lib/spbu/format";
import { BBM_PRESETS, SPBU_PRESETS, buatNoTrans, hitungDariDibayar } from "@/lib/spbu/presets";
import type { SpbuData } from "@/lib/spbu/types";
import { cekAgen, cetakViaAgen, daftarPrinterAgen } from "@/lib/struk/agent";
import { barisKeTeks, renderStruk, sekarangLokal } from "@/lib/struk/format";
import { getLogoBitmaps } from "@/lib/struk/logos";
import { adalahSpbu, type NotaData } from "@/lib/struk/nota";
import {
  DEFAULT_CN,
  DEFAULT_GOLONGAN,
  GAYA_PRESETS,
  KARTU_PRESETS,
  buatKodeGardu,
  buatNoSeri,
  findOperator,
} from "@/lib/struk/presets";
import {
  hapusDariRiwayat,
  kosongkanRiwayat,
  muatRiwayat,
  simpanKeRiwayat,
  sinkronSupabase,
} from "@/lib/struk/storage";
import type { LebarKertas, PrinterInfo, PrintResult, StrukData } from "@/lib/struk/types";
import { cn } from "@/lib/utils";
import { FilePlus2, Fuel, Printer, Save, TrafficCone } from "lucide-react";
import Link from "next/link";
import { SpbuForm, terapkanSpbu } from "../spbu/spbu-form";
import { StrukForm, terapkanGerbang } from "./struk-form";
import { StrukHistory } from "./struk-history";
import { StrukPreview } from "./struk-preview";

const GERBANG_DEFAULT = "halim";
/** Logo kepala struk SPBU (sama dengan LOGO_SPBU di server). */
const LOGO_SPBU = ["pertamina"];

function strukBaru(dasar?: Partial<StrukData>): StrukData {
  const now = new Date();
  const kosong: StrukData = {
    jenis: "tol",
    id: crypto.randomUUID(),
    gerbangId: GERBANG_DEFAULT,
    operatorId: "jm-ihc",
    logoIds: [],
    subJudul: "",
    infoTol: "",
    gerbang: "",
    lebarKertas: 58,
    tanggal: sekarangLokal(now),
    kodeGardu: buatKodeGardu(),
    noSeri: buatNoSeri(),
    kodeTrx: "",
    sistem: "terbuka",
    asalKode: "",
    asalNama: "",
    golongan: DEFAULT_GOLONGAN,
    kartuLabel: KARTU_PRESETS[0].label,
    tarif: 0,
    cn: DEFAULT_CN,
    saldo: 0,
    peringatanSaldo: false,
    gaya: { ...GAYA_PRESETS.halim },
    createdAt: now.toISOString(),
    ...dasar,
  };
  return terapkanGerbang(kosong, dasar?.gerbangId ?? GERBANG_DEFAULT);
}

/** Struk SPBU baru: SPBU pertama di preset, Bio Solar (BBM armada Hino), bayar Rp 100.000. */
function spbuBaru(dasar?: Partial<SpbuData>): SpbuData {
  const now = new Date();
  const bbm = BBM_PRESETS[0];
  const dibayar = 100_000;
  const kosong: SpbuData = {
    jenis: "spbu",
    id: crypto.randomUUID(),
    spbuId: SPBU_PRESETS[0].id,
    kode: "",
    nama: "",
    alamat: "",
    shift: "1",
    noTrans: buatNoTrans(),
    waktu: sekarangLokal(now),
    pulauPompa: "1",
    operator: "",
    jenisBbm: bbm.label,
    volume: 0,
    subsidi: bbm.subsidi,
    hargaNonSubsidi: bbm.hargaNonSubsidi,
    hargaJual: bbm.hargaJual,
    totalTanpaSubsidi: 0,
    totalSubsidi: 0,
    dibayar,
    metode: "CASH",
    noPlat: "",
    catatanSubsidi: true,
    createdAt: now.toISOString(),
    ...dasar,
  };
  const turunan = hitungDariDibayar(kosong.dibayar, kosong.hargaJual, kosong.hargaNonSubsidi);
  return terapkanSpbu({ ...kosong, ...turunan }, dasar?.spbuId ?? SPBU_PRESETS[0].id);
}

type Status = { jenis: "ok" | "error" | "info"; teks: string } | null;
type Jenis = "tol" | "spbu";

export function StrukApp() {
  // Komponen ini dimuat dengan ssr:false (lihat struk-app-loader), jadi inisialisasi
  // yang bergantung pada waktu/acak/localStorage aman dilakukan di sini.
  const [jenis, setJenis] = useState<Jenis>("tol");
  const [data, setData] = useState<StrukData>(() => strukBaru());
  const [spbu, setSpbu] = useState<SpbuData>(() => spbuBaru());
  const [riwayat, setRiwayat] = useState<NotaData[]>(() => muatRiwayat());
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [printer, setPrinter] = useState<string>("POS80");
  const [copies, setCopies] = useState(1);
  // matikan bila driver Windows sudah memotong sendiri (Printing Preferences > Cutter)
  const [cut, setCut] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  // Jalur cetak: "agen" = agen cetak lokal di PC pengguna (web di cloud), "server" = server
  // web ini sendiri berjalan di PC yang tersambung printer (Windows), "tidak-ada" = belum siap.
  const [mode, setMode] = useState<"mencari" | "agen" | "server" | "tidak-ada">("mencari");

  const pilihDefault = useCallback((daftar: PrinterInfo[], def: string) => {
    // urutan: nama persis -> "POS80" dengan port USB/virtual (bukan LPT) -> "POS80" apa pun
    // -> "POS" -> printer pertama
    const pos80 = daftar.filter((p) => /pos.?80/i.test(p.name));
    const pilihan =
      daftar.find((p) => p.name === def) ??
      pos80.find((p) => !/^LPT/i.test(p.port)) ??
      pos80[0] ??
      daftar.find((p) => /\bpos\b/i.test(p.name)) ??
      daftar[0];
    setPrinter(pilihan?.name ?? def);
  }, []);

  useEffect(() => {
    let aktif = true;
    (async () => {
      const agen = await cekAgen();
      if (!aktif) return;
      if (agen) {
        const daftar = await daftarPrinterAgen();
        if (!aktif) return;
        setPrinters(daftar);
        pilihDefault(daftar, "POS80");
        setMode("agen");
        return;
      }
      try {
        const r = await fetch("/api/print");
        const j = (await r.json()) as { printers?: PrinterInfo[]; default?: string; platform?: string };
        if (!aktif) return;
        const daftar = j.printers ?? [];
        if (j.platform === "win32" && daftar.length > 0) {
          setPrinters(daftar);
          pilihDefault(daftar, j.default ?? "POS80");
          setMode("server");
          return;
        }
      } catch {
        /* server bukan Windows / tidak ada printer */
      }
      if (aktif) setMode("tidak-ada");
    })();
    return () => {
      aktif = false;
    };
  }, [pilihDefault]);

  const lebar: LebarKertas = jenis === "spbu" ? 58 : data.lebarKertas === 80 ? 80 : 58;
  const logos = useMemo(
    () => (jenis === "spbu" ? getLogoBitmaps(LOGO_SPBU, 58) : getLogoBitmaps(data.logoIds, lebar)),
    [jenis, data.logoIds, lebar],
  );
  const lines = useMemo(
    () => (jenis === "spbu" ? renderSpbu(spbu) : renderStruk(data, logos)),
    [jenis, spbu, data, logos],
  );
  // Kepala struk (logo + sub-judul + Info Tol) dirender server sebagai PNG yang sama dengan raster cetak
  const headerSrc = useMemo(() => {
    if (jenis === "spbu") return `/api/header?${new URLSearchParams({ logos: LOGO_SPBU.join(","), lebar: "58" })}`;
    if (logos.length === 0 && !data.subJudul.trim() && !data.infoTol.trim()) return null;
    const q = new URLSearchParams({
      logos: data.logoIds.join(","),
      sub: data.subJudul,
      info: data.infoTol,
      ikon: findOperator(data.operatorId).ikonTelepon ? "1" : "0",
      lebar: String(lebar),
    });
    return `/api/header?${q.toString()}`;
  }, [jenis, data.logoIds, data.subJudul, data.infoTol, data.operatorId, lebar, logos.length]);

  const notaAktif: NotaData = jenis === "spbu" ? spbu : data;

  const simpan = useCallback(async (d: NotaData) => {
    setRiwayat(simpanKeRiwayat(d));
    const s = await sinkronSupabase(d);
    if (s === "error") {
      setStatus({ jenis: "info", teks: "Tersimpan lokal. Sinkron Supabase gagal (cek tabel toll_receipts)." });
    }
  }, []);

  const cetak = useCallback(
    async (d: NotaData) => {
      if (mode === "tidak-ada" || mode === "mencari") {
        setStatus({
          jenis: "error",
          teks: "Agen cetak belum terpasang di komputer ini. Buka halaman Pasang Agen Cetak, atau pakai Cetak via browser.",
        });
        return;
      }
      setBusy(true);
      setStatus({ jenis: "info", teks: `Mengirim ke ${printer}...` });
      try {
        let j: PrintResult;
        if (mode === "agen") {
          // byte ESC/POS dibuat di server (cloud), dikirim ke agen lokal di PC pengguna
          const r = await fetch("/api/escpos", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ struk: d, copies, cut }),
          });
          const e = (await r.json()) as { ok: boolean; data?: string; docName?: string; message?: string };
          if (!e.ok || !e.data) throw new Error(e.message ?? "Gagal membuat data cetak");
          j = await cetakViaAgen(printer, e.data, e.docName ?? "Struk");
        } else {
          const res = await fetch("/api/print", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ struk: d, printer, copies, cut }),
          });
          j = (await res.json()) as PrintResult;
        }
        setStatus({ jenis: j.ok ? "ok" : "error", teks: j.message });
        if (j.ok) await simpan(d);
      } catch (e) {
        setStatus({ jenis: "error", teks: (e as Error).message });
      } finally {
        setBusy(false);
      }
    },
    [copies, cut, mode, printer, simpan],
  );

  const muatDariRiwayat = (d: NotaData) => {
    if (adalahSpbu(d)) {
      setJenis("spbu");
      setSpbu({ ...d });
      setStatus({ jenis: "info", teks: `Dimuat: ${d.nama} trans ${d.noTrans}` });
    } else {
      setJenis("tol");
      setData({ ...d, jenis: "tol" });
      setStatus({ jenis: "info", teks: `Dimuat: ${d.gerbang} seri ${d.noSeri}` });
    }
  };

  const strukBaruSesuaiJenis = () => {
    if (jenis === "spbu") {
      setSpbu(spbuBaru({ spbuId: spbu.spbuId, jenisBbm: spbu.jenisBbm, subsidi: spbu.subsidi, hargaJual: spbu.hargaJual, hargaNonSubsidi: spbu.hargaNonSubsidi, noPlat: spbu.noPlat, operator: spbu.operator, pulauPompa: spbu.pulauPompa, shift: spbu.shift }));
    } else {
      setData(strukBaru({ gerbangId: data.gerbangId, golongan: data.golongan, kartuLabel: data.kartuLabel, cn: data.cn }));
    }
    setStatus(null);
  };

  const tabClass = (aktif: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      aktif ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
    );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,34rem)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2" role="tablist" aria-label="Jenis struk">
              <button type="button" role="tab" aria-selected={jenis === "tol"} className={tabClass(jenis === "tol")} onClick={() => setJenis("tol")}>
                <TrafficCone className="size-4" /> Struk Tol
              </button>
              <button type="button" role="tab" aria-selected={jenis === "spbu"} className={tabClass(jenis === "spbu")} onClick={() => setJenis("spbu")}>
                <Fuel className="size-4" /> Struk SPBU
              </button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={strukBaruSesuaiJenis}>
              <FilePlus2 className="size-4" /> Struk baru
            </Button>
          </CardHeader>
          <CardContent>
            {jenis === "spbu" ? <SpbuForm data={spbu} onChange={setSpbu} /> : <StrukForm data={data} onChange={setData} />}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Pratinjau (kertas 80mm, {lebar === 80 ? "lebar penuh" : "blok 58mm rapat kiri"})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StrukPreview lines={lines} headerSrc={headerSrc} lebar={lebar} />

              <div className="grid gap-3">
                <p className="text-xs text-muted-foreground">
                  {mode === "mencari" && "Mencari agen cetak di komputer ini..."}
                  {mode === "agen" && "Agen cetak lokal terdeteksi: cetak langsung ke printer USB komputer ini."}
                  {mode === "server" && "Server berjalan di komputer yang tersambung printer."}
                  {mode === "tidak-ada" && (
                    <>
                      Agen cetak belum terpasang di komputer ini.{" "}
                      <Link href="/agen" className="underline">
                        Pasang Agen Cetak
                      </Link>{" "}
                      (sekali saja), atau pakai Cetak via browser.
                    </>
                  )}
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="printer">Printer</Label>
                  <select
                    id="printer"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={printer}
                    onChange={(e) => setPrinter(e.target.value)}
                  >
                    {printers.length === 0 && <option value={printer}>{printer}</option>}
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.port})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Label htmlFor="copies">Salinan</Label>
                  <input
                    id="copies"
                    type="number"
                    min={1}
                    max={5}
                    value={copies}
                    onChange={(e) => setCopies(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
                    className="h-9 w-20 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={cut} onCheckedChange={(v) => setCut(v === true)} />
                  Potong kertas dari aplikasi (matikan bila driver sudah memotong sendiri)
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={busy} onClick={() => cetak(notaAktif)}>
                    <Printer className="size-4" /> Cetak ESC/POS
                  </Button>
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => window.print()}>
                    Cetak via browser
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => simpan(notaAktif)}>
                    <Save className="size-4" /> Simpan saja
                  </Button>
                </div>
                {status && (
                  <p
                    role="status"
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm",
                      status.jenis === "ok" && "border-emerald-500/40 bg-emerald-500/10",
                      status.jenis === "error" && "border-destructive/50 bg-destructive/10 text-destructive",
                      status.jenis === "info" && "bg-muted",
                    )}
                  >
                    {status.teks}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat</CardTitle>
            </CardHeader>
            <CardContent>
              <StrukHistory
                items={riwayat}
                busy={busy}
                onLoad={muatDariRiwayat}
                onPrint={cetak}
                onDelete={(id) => setRiwayat(hapusDariRiwayat(id))}
                onClear={() => setRiwayat(kosongkanRiwayat())}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Area khusus cetak via browser (driver Windows POS80 / POS-80C); tanpa logo */}
      <div id="print-area" aria-hidden>
        <pre>{lines.map((l) => barisKeTeks(l, lebar)).join("\n")}</pre>
      </div>
    </>
  );
}
