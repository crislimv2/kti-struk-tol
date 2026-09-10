"use client";

import dynamic from "next/dynamic";

function Kerangka() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <div className="h-[32rem] animate-pulse rounded-lg border bg-muted/40" />
      <div className="h-[32rem] animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}

/**
 * StrukApp hanya dirender di browser: nilai default (jam sekarang, nomor transaksi acak,
 * riwayat localStorage) tidak boleh ikut SSR agar tidak terjadi hydration mismatch.
 */
export const StrukAppLoader = dynamic(
  () => import("./struk-app").then((m) => m.StrukApp),
  { ssr: false, loading: Kerangka },
);
