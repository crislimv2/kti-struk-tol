"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sekarangLokal } from "@/lib/struk/format";
import {
  AMBANG_SALDO_RENDAH,
  GAYA_PRESETS,
  GERBANG_PRESETS,
  KARTU_PRESETS,
  OPERATORS,
  buatCn,
  buatKodeGardu,
  buatKodeTrx,
  buatNoSeri,
  findGerbang,
  findOperator,
} from "@/lib/struk/presets";
import type { GayaStruk, SistemTol, StrukData } from "@/lib/struk/types";
import { RefreshCw } from "lucide-react";

interface Props {
  data: StrukData;
  onChange: (next: StrukData) => void;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

/** Terapkan preset gerbang ke data (dipakai form dan tombol "Struk baru"). */
export function terapkanGerbang(data: StrukData, gerbangId: string): StrukData {
  const g = findGerbang(gerbangId);
  const op = findOperator(g.operatorId);
  const gaya = { ...GAYA_PRESETS[g.gaya] };
  return {
    ...data,
    gerbangId: g.id,
    operatorId: op.id,
    logoIds: [...op.logoIds],
    subJudul: op.subJudul,
    infoTol: g.infoTol ?? op.infoTol,
    lebarKertas: op.lebarKertas,
    gerbang: g.id === "custom" ? data.gerbang : g.nama,
    sistem: g.sistem,
    asalKode: g.asalKode ?? "",
    asalNama: g.asalNama ?? "",
    gaya,
    kodeTrx: buatKodeTrx(gaya.kodePemisah),
  };
}

export function StrukForm({ data, onChange }: Props) {
  const set = <K extends keyof StrukData>(key: K, value: StrukData[K]) =>
    onChange({ ...data, [key]: value });
  const setGaya = <K extends keyof GayaStruk>(key: K, value: GayaStruk[K]) =>
    onChange({ ...data, gaya: { ...data.gaya, [key]: value } });

  const gantiOperator = (id: string) => {
    const op = findOperator(id);
    onChange({
      ...data,
      operatorId: op.id,
      logoIds: [...op.logoIds],
      subJudul: op.subJudul,
      infoTol: op.infoTol,
      lebarKertas: op.lebarKertas,
    });
  };

  const gantiKartu = (label: string) => {
    const k = KARTU_PRESETS.find((x) => x.label === label);
    const cnMasihPrefix = !data.cn.trim() || KARTU_PRESETS.some((x) => data.cn.trim() === x.prefix);
    onChange({ ...data, kartuLabel: label, cn: k && cnMasihPrefix ? k.prefix : data.cn });
  };

  const gantiSaldo = (n: number) =>
    onChange({ ...data, saldo: n, peringatanSaldo: n > 0 && n < AMBANG_SALDO_RENDAH });

  const kartuPreset = KARTU_PRESETS.some((k) => k.label === data.kartuLabel);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gerbang & Operator
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="gerbang-preset">Gerbang tol</Label>
            <select
              id="gerbang-preset"
              className={selectClass}
              value={data.gerbangId}
              onChange={(e) => onChange(terapkanGerbang(data, e.target.value))}
            >
              {GERBANG_PRESETS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama}
                  {g.id !== "custom" ? ` - ${findOperator(g.operatorId).nama}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="operator">Operator / logo</Label>
            <select
              id="operator"
              className={selectClass}
              value={data.operatorId}
              onChange={(e) => gantiOperator(e.target.value)}
            >
              {OPERATORS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gerbang">Nama gerbang (dicetak)</Label>
            <Input
              id="gerbang"
              value={data.gerbang}
              onChange={(e) => set("gerbang", e.target.value)}
              placeholder="HALIM"
              maxLength={32}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subjudul">Sub-judul di bawah logo</Label>
            <Input
              id="subjudul"
              value={data.subJudul}
              onChange={(e) => set("subJudul", e.target.value)}
              placeholder={
                data.logoIds.includes("jasamarga-ihc")
                  ? "(sudah termasuk di logo: Indonesia Highway Corporation)"
                  : "TRANSJAWA TOL"
              }
              maxLength={42}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="infotol">Info Tol</Label>
            <Input
              id="infotol"
              value={data.infoTol}
              onChange={(e) => set("infoTol", e.target.value)}
              placeholder="14080"
              maxLength={24}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lebar">Lebar kertas struk asli</Label>
            <select
              id="lebar"
              className={selectClass}
              value={data.lebarKertas}
              onChange={(e) => set("lebarKertas", Number(e.target.value) === 80 ? 80 : 58)}
            >
              <option value={58}>58mm (Jasa Marga, Waskita) - blok rapat kiri</option>
              <option value={80}>80mm (Hutama Karya) - lebar penuh</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sistem">Sistem</Label>
            <select
              id="sistem"
              className={selectClass}
              value={data.sistem}
              onChange={(e) => set("sistem", e.target.value as SistemTol)}
            >
              <option value="terbuka">Terbuka (tanpa asal gerbang)</option>
              <option value="tertutup">Tertutup (cetak asal gerbang)</option>
            </select>
          </div>
          {data.sistem === "tertutup" && (
            <>
              {data.gaya.asal === "gerbang" && (
                <div className="grid gap-2">
                  <Label htmlFor="asalkode">Kode asal</Label>
                  <Input
                    id="asalkode"
                    value={data.asalKode}
                    onChange={(e) => set("asalKode", e.target.value)}
                    placeholder="41"
                    maxLength={4}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="asalnama">Nama asal gerbang</Label>
                <Input
                  id="asalnama"
                  value={data.asalNama}
                  onChange={(e) => set("asalNama", e.target.value)}
                  placeholder="JAPEK OPEN"
                  maxLength={20}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Transaksi
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 [&>div]:min-w-0">
          {/* datetime-local punya lebar minimum internal ~250px di Chromium, jadi ambil 2 kolom */}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="tanggal">Tanggal & jam</Label>
            <div className="flex gap-2">
              <Input
                id="tanggal"
                className="min-w-0"
                type="datetime-local"
                step={1}
                value={data.tanggal}
                onChange={(e) => set("tanggal", e.target.value)}
              />
              <Button
                type="button"
                className="shrink-0"
                variant="outline"
                size="icon"
                title="Pakai waktu sekarang"
                onClick={() => set("tanggal", sekarangLokal())}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kodegardu">Kode gardu (kanan tanggal)</Label>
            <div className="flex gap-2">
              <Input
                id="kodegardu"
                value={data.kodeGardu}
                onChange={(e) => set("kodeGardu", e.target.value)}
                placeholder="09/03/03"
                maxLength={12}
              />
              <Button type="button" className="shrink-0" variant="outline" size="icon" title="Acak" onClick={() => set("kodeGardu", buatKodeGardu())}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="noseri">No seri</Label>
            <div className="flex gap-2">
              <Input
                id="noseri"
                value={data.noSeri}
                onChange={(e) => set("noSeri", e.target.value)}
                placeholder="052462"
                maxLength={10}
              />
              <Button type="button" className="shrink-0" variant="outline" size="icon" title="Acak" onClick={() => set("noSeri", buatNoSeri())}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kodetrx">Kode transaksi (kanan no seri)</Label>
            <div className="flex gap-2">
              <Input
                id="kodetrx"
                value={data.kodeTrx}
                onChange={(e) => set("kodeTrx", e.target.value)}
                placeholder="008422/250033"
                maxLength={16}
              />
              <Button
                type="button"
                className="shrink-0"
                variant="outline"
                size="icon"
                title="Acak"
                onClick={() => set("kodeTrx", buatKodeTrx(data.gaya.kodePemisah))}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Golongan, Kartu & Tarif
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="golongan">Golongan</Label>
            <select
              id="golongan"
              className={selectClass}
              value={data.golongan}
              onChange={(e) => set("golongan", Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}
                  {g === 3 ? " (Hino Euro 4 FL260JW, 3 gandar)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tarif">Tarif (Rp)</Label>
            <Input
              id="tarif"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={data.tarif || ""}
              onChange={(e) => set("tarif", Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kartu">Kartu</Label>
            <select
              id="kartu"
              className={selectClass}
              value={kartuPreset ? data.kartuLabel : "__lain"}
              onChange={(e) => (e.target.value === "__lain" ? set("kartuLabel", "") : gantiKartu(e.target.value))}
            >
              {KARTU_PRESETS.map((k) => (
                <option key={k.label} value={k.label}>
                  {k.label}
                </option>
              ))}
              <option value="__lain">Lainnya</option>
            </select>
          </div>
          {!kartuPreset && (
            <div className="grid gap-2">
              <Label htmlFor="kartu-lain">Label kartu</Label>
              <Input
                id="kartu-lain"
                value={data.kartuLabel}
                onChange={(e) => set("kartuLabel", e.target.value)}
                placeholder="e-Toll BCA"
                maxLength={16}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="cn">Nomor kartu (CN)</Label>
            <div className="flex gap-2">
              <Input
                id="cn"
                className="min-w-0"
                inputMode="numeric"
                value={data.cn}
                onChange={(e) => set("cn", e.target.value.replace(/\D/g, ""))}
                placeholder="0145202401284656"
                maxLength={19}
              />
              <Button
                type="button"
                className="shrink-0"
                variant="outline"
                size="icon"
                title="Acak nomor kartu (jumlah digit sama, awalan bank tetap)"
                onClick={() => set("cn", buatCn(data.cn, data.kartuLabel))}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.cn.replace(/\D/g, "").length} digit
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="saldo">Sisa saldo (Rp)</Label>
            <Input
              id="saldo"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={data.saldo || ""}
              onChange={(e) => gantiSaldo(Number(e.target.value) || 0)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={data.peringatanSaldo}
              onCheckedChange={(v) => set("peringatanSaldo", v === true)}
            />
            Cetak &quot;HARAP SEGERA ISI ULANG.&quot; (otomatis bila saldo di bawah Rp {AMBANG_SALDO_RENDAH.toLocaleString("id-ID")})
          </label>
        </div>
      </section>

      <details className="group rounded-md border px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Gaya cetak (mengikuti mesin gerbang, jarang perlu diubah)
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="g-seri">Label seri</Label>
            <select id="g-seri" className={selectClass} value={data.gaya.seri} onChange={(e) => setGaya("seri", e.target.value as GayaStruk["seri"])}>
              <option value="No seri :">No seri :052462</option>
              <option value="Seri:">Seri:398446</option>
              <option value="No Seri : ">No Seri : 094300</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-pemisah">Pemisah kode transaksi</Label>
            <select id="g-pemisah" className={selectClass} value={data.gaya.kodePemisah} onChange={(e) => setGaya("kodePemisah", e.target.value as GayaStruk["kodePemisah"])}>
              <option value="/">008422/250033</option>
              <option value="-">150776-250025</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-asal">Baris asal</Label>
            <select id="g-asal" className={selectClass} value={data.gaya.asal} onChange={(e) => setGaya("asal", e.target.value as GayaStruk["asal"])}>
              <option value="gerbang">Asal Gerbang : 41 [JAPEK OPEN]</option>
              <option value="gb">Asal GB : KUNCIRAN 5</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-gol">Awalan golongan</Label>
            <select id="g-gol" className={selectClass} value={data.gaya.gol} onChange={(e) => setGaya("gol", e.target.value as GayaStruk["gol"])}>
              <option value="GOL-">GOL-3</option>
              <option value="Gol-">Gol-3</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-kartu">Huruf kartu</Label>
            <select id="g-kartu" className={selectClass} value={data.gaya.kartu} onChange={(e) => setGaya("kartu", e.target.value as GayaStruk["kartu"])}>
              <option value="normal">e-Toll BCA</option>
              <option value="kapital">E-TOLL BCA</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="g-tarif">Format tarif</Label>
            <select id="g-tarif" className={selectClass} value={data.gaya.tarif} onChange={(e) => setGaya("tarif", e.target.value as GayaStruk["tarif"])}>
              <option value="rp">Rp16500</option>
              <option value="polos">16500</option>
              <option value="rp-titik">Rp 16.500</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={data.gaya.cnTanpaNol} onCheckedChange={(v) => setGaya("cnTanpaNol", v === true)} />
            CN tanpa angka 0 di depan (gaya Hutama Karya)
          </label>
        </div>
      </details>
    </div>
  );
}
