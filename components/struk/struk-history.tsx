"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTarif, pecahTanggal } from "@/lib/struk/format";
import type { StrukData } from "@/lib/struk/types";
import { FolderOpen, Printer, Trash2 } from "lucide-react";

interface Props {
  items: StrukData[];
  onLoad: (d: StrukData) => void;
  onPrint: (d: StrukData) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  busy?: boolean;
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
          const { tanggal, jam } = pecahTanggal(d.tanggal);
          const cn4 = d.cn.replace(/\D/g, "").slice(-4);
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.gerbang || "(tanpa gerbang)"}</span>
                  <Badge variant="secondary">Gol {d.golongan}</Badge>
                  {cn4 && <Badge variant="outline">CN ...{cn4}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tanggal} {jam} · seri {d.noSeri} · {d.kartuLabel}
                </div>
              </div>
              <div className="font-mono tabular-nums">{formatTarif(d.tarif, d.gaya)}</div>
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
