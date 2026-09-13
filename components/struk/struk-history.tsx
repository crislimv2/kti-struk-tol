"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { angkaKoma } from "@/lib/spbu/format";
import { formatTarif, pecahTanggal } from "@/lib/struk/format";
import { adalahSpbu, type NotaData } from "@/lib/struk/nota";
import { FolderOpen, Printer, Trash2 } from "lucide-react";

interface Props {
  items: NotaData[];
  onLoad: (d: NotaData) => void;
  onPrint: (d: NotaData) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  busy?: boolean;
}

function ringkas(d: NotaData) {
  if (adalahSpbu(d)) {
    const { tanggal, jam } = pecahTanggal(d.waktu);
    return {
      judul: d.nama || "(SPBU)",
      badge: "SPBU",
      badge2: d.jenisBbm,
      sub: `${tanggal} ${jam} · trans ${d.noTrans} · ${d.volume.toFixed(2)} L · ${d.noPlat}`,
      nominal: `Rp ${angkaKoma(d.dibayar)}`,
    };
  }
  const { tanggal, jam } = pecahTanggal(d.tanggal);
  const cn4 = d.cn.replace(/\D/g, "").slice(-4);
  return {
    judul: d.gerbang || "(tanpa gerbang)",
    badge: `Gol ${d.golongan}`,
    badge2: cn4 ? `CN ...${cn4}` : "",
    sub: `${tanggal} ${jam} · seri ${d.noSeri} · ${d.kartuLabel}`,
    nominal: formatTarif(d.tarif, d.gaya),
  };
}

export function StrukHistory({ items, onLoad, onPrint, onDelete, onClear, busy }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada riwayat. Struk yang dicetak atau disimpan akan muncul di sini.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} struk tersimpan di browser ini</p>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={busy}>
          Kosongkan
        </Button>
      </div>
      <ul className="divide-y rounded-md border">
        {items.map((d) => {
          const r = ringkas(d);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.judul}</span>
                  <Badge variant="secondary">{r.badge}</Badge>
                  {r.badge2 && <Badge variant="outline">{r.badge2}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{r.sub}</div>
              </div>
              <div className="font-mono tabular-nums">{r.nominal}</div>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" title="Muat ke form" onClick={() => onLoad(d)}>
                  <FolderOpen className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" title="Cetak ulang" disabled={busy} onClick={() => onPrint(d)}>
                  <Printer className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" title="Hapus" disabled={busy} onClick={() => onDelete(d.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
