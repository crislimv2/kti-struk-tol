"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BBM_PRESETS,
  METODE_BAYAR,
  SPBU_PRESETS,
  buatNoTrans,
  findBbm,
  findSpbu,
  hitungDariDibayar,
  hitungDariVolume,
} from "@/lib/spbu/presets";
import type { SpbuData } from "@/lib/spbu/types";
import { sekarangLokal } from "@/lib/struk/format";
import { RefreshCw } from "lucide-react";

interface Props {
  data: SpbuData;
  onChange: (next: SpbuData) => void;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** Terapkan preset SPBU (kode, nama, alamat). */
export function terapkanSpbu(data: SpbuData, spbuId: string): SpbuData {
  const s = findSpbu(spbuId);
  return {
    ...data,
    spbuId: s.id,
    kode: s.id === "custom" ? data.kode : s.kode,
    nama: s.id === "custom" ? data.nama : s.nama,
    alamat: s.id === "custom" ? data.alamat : s.alamat,
  };
}

export function SpbuForm({ data, onChange }: Props) {
  const set = <K extends keyof SpbuData>(key: K, value: SpbuData[K]) =>
    onChange({ ...data, [key]: value });

  const gantiBbm = (label: string) => {
    const b = findBbm(label);
    if (!b) {
      set("jenisBbm", label);
      return;
    }
    const turunan = hitungDariVolume(data.volume, b.hargaJual, b.hargaNonSubsidi);
    onChange({
      ...data,
      jenisBbm: b.label,
      subsidi: b.subsidi,
      hargaJual: b.hargaJual,
      hargaNonSubsidi: b.subsidi ? b.hargaNonSubsidi : b.hargaJual,
      ...turunan,
    });
  };

  /** ubah volume -> hitung ulang dibayar & subsidi */
  const gantiVolume = (v: number) =>
    onChange({ ...data, volume: v, ...hitungDariVolume(v, data.hargaJual, data.hargaNonSubsidi) });

  /** ubah nominal bayar (mis. isi Rp 100.000) -> hitung volume */
  const gantiDibayar = (rp: number) =>
    onChange({ ...data, dibayar: rp, ...hitungDariDibayar(rp, data.hargaJual, data.hargaNonSubsidi) });

  const gantiHarga = (key: "hargaJual" | "hargaNonSubsidi", v: number) => {
    const next = { ...data, [key]: v };
    onChange({ ...next, ...hitungDariVolume(next.volume, next.hargaJual, next.hargaNonSubsidi) });
  };

  const bbmPreset = BBM_PRESETS.some((b) => b.label === data.jenisBbm);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">SPBU</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="spbu-preset">SPBU</Label>
            <select
              id="spbu-preset"
              className={selectClass}
              value={data.spbuId}
              onChange={(e) => onChange(terapkanSpbu(data, e.target.value))}
            >
              {SPBU_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id === "custom" ? "Lainnya (isi manual)" : `${s.kode} - ${s.nama}`}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-kode">Kode SPBU</Label>
            <Input id="spbu-kode" value={data.kode} onChange={(e) => set("kode", e.target.value)} placeholder="14201147" maxLength={12} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-nama">Nama SPBU</Label>
            <Input id="spbu-nama" value={data.nama} onChange={(e) => set("nama", e.target.value)} placeholder="SPBU AH.NASUTION NO.28" maxLength={32} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="spbu-alamat">Alamat</Label>
            <Input id="spbu-alamat" value={data.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="JL. A.H.NASUTION NO. 28 MEDAN" maxLength={32} />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Transaksi</h3>
        <div className="grid gap-2 sm:grid-cols-2 [&>div]:min-w-0">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="spbu-waktu">Waktu</Label>
            <div className="flex gap-2">
              <Input id="spbu-waktu" className="min-w-0" type="datetime-local" step={1} value={data.waktu} onChange={(e) => set("waktu", e.target.value)} />
              <Button type="button" className="shrink-0" variant="outline" size="icon" title="Pakai waktu sekarang" onClick={() => set("waktu", sekarangLokal())}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-shift">Shift</Label>
            <Input id="spbu-shift" value={data.shift} onChange={(e) => set("shift", e.target.value)} maxLength={2} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-notrans">No. Trans</Label>
            <div className="flex gap-2">
              <Input id="spbu-notrans" className="min-w-0" value={data.noTrans} onChange={(e) => set("noTrans", e.target.value)} maxLength={10} />
              <Button type="button" className="shrink-0" variant="outline" size="icon" title="Acak" onClick={() => set("noTrans", buatNoTrans())}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-pompa">Pulau/Pompa</Label>
            <Input id="spbu-pompa" value={data.pulauPompa} onChange={(e) => set("pulauPompa", e.target.value)} maxLength={4} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-operator">Operator</Label>
            <Input id="spbu-operator" value={data.operator} onChange={(e) => set("operator", e.target.value)} placeholder="RAIHAN" maxLength={18} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-plat">No. Plat</Label>
            <Input id="spbu-plat" value={data.noPlat} onChange={(e) => set("noPlat", e.target.value)} placeholder="K1924ES" maxLength={12} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-metode">Metode bayar</Label>
            <select id="spbu-metode" className={selectClass} value={data.metode} onChange={(e) => set("metode", e.target.value)}>
              {METODE_BAYAR.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">BBM & Harga</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="spbu-bbm">Jenis BBM</Label>
            <select
              id="spbu-bbm"
              className={selectClass}
              value={bbmPreset ? data.jenisBbm : "__lain"}
              onChange={(e) => (e.target.value === "__lain" ? set("jenisBbm", "") : gantiBbm(e.target.value))}
            >
              {BBM_PRESETS.map((b) => (
                <option key={b.id} value={b.label}>
                  {b.label}{b.subsidi ? " (subsidi)" : ""}
                </option>
              ))}
              <option value="__lain">Lainnya</option>
            </select>
          </div>
          {!bbmPreset && (
            <div className="grid gap-2">
              <Label htmlFor="spbu-bbm-lain">Label BBM</Label>
              <Input id="spbu-bbm-lain" value={data.jenisBbm} onChange={(e) => set("jenisBbm", e.target.value)} placeholder="BIO_SOLAR" maxLength={16} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={data.subsidi} onCheckedChange={(v) => set("subsidi", v === true)} />
            BBM bersubsidi (cetak Harga Non Subsidi, Subsidi Pemerintah, dan catatan subsidi)
          </label>
          <div className="grid gap-2">
            <Label htmlFor="spbu-hjual">Harga Jual (Rp/liter)</Label>
            <Input id="spbu-hjual" type="number" inputMode="numeric" min={0} value={data.hargaJual || ""} onChange={(e) => gantiHarga("hargaJual", Number(e.target.value) || 0)} />
          </div>
          {data.subsidi && (
            <div className="grid gap-2">
              <Label htmlFor="spbu-hnon">Harga Non Subsidi (Rp/liter)</Label>
              <Input id="spbu-hnon" type="number" inputMode="numeric" min={0} value={data.hargaNonSubsidi || ""} onChange={(e) => gantiHarga("hargaNonSubsidi", Number(e.target.value) || 0)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="spbu-dibayar">Dibayar konsumen (Rp)</Label>
            <Input id="spbu-dibayar" type="number" inputMode="numeric" min={0} step={1000} value={data.dibayar || ""} onChange={(e) => gantiDibayar(Number(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground">Mengisi ini menghitung volume otomatis (dibayar / harga jual).</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="spbu-volume">Volume (liter)</Label>
            <Input id="spbu-volume" type="number" inputMode="decimal" min={0} step={0.01} value={data.volume || ""} onChange={(e) => gantiVolume(Number(e.target.value) || 0)} />
            <p className="text-xs text-muted-foreground">Mengisi ini menghitung dibayar otomatis (volume x harga jual).</p>
          </div>
          {data.subsidi && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="spbu-tanpa">Total tanpa subsidi (Rp)</Label>
                <Input id="spbu-tanpa" type="number" inputMode="numeric" min={0} value={data.totalTanpaSubsidi || ""} onChange={(e) => { const v = Number(e.target.value) || 0; onChange({ ...data, totalTanpaSubsidi: v, totalSubsidi: Math.max(0, v - data.dibayar) }); }} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spbu-subsidi">Subsidi pemerintah (Rp)</Label>
                <Input id="spbu-subsidi" type="number" inputMode="numeric" min={0} value={data.totalSubsidi || ""} onChange={(e) => set("totalSubsidi", Number(e.target.value) || 0)} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox checked={data.catatanSubsidi} onCheckedChange={(v) => set("catatanSubsidi", v === true)} />
                Cetak paragraf &quot;Anda mendapat subsidi dari Pemerintah ...&quot;
              </label>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
