"use client";

import { createClient } from "@/lib/supabase/client";
import { hasEnvVars } from "@/lib/utils";
import { barisKeTeks, renderStruk } from "./format";
import type { StrukData } from "./types";

/** v2 = format asli 58mm (riwayat v1 format 32/48 kolom tidak kompatibel dan diabaikan). */
const KEY = "kti-struk-tol-v2";
const MAX = 500;

function aman<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function muatRiwayat(): StrukData[] {
  if (typeof window === "undefined") return [];
  return aman(() => {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as StrukData[]) : [];
    return Array.isArray(arr)
      ? arr
          .filter((x) => x && typeof x.gaya === "object")
          .map((x) => ({ ...x, lebarKertas: x.lebarKertas === 80 ? 80 : 58 }))
      : [];
  }, []);
}

function simpanSemua(list: StrukData[]) {
  aman(() => window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))), undefined);
}

export function simpanKeRiwayat(d: StrukData): StrukData[] {
  const list = muatRiwayat().filter((x) => x.id !== d.id);
  const next = [d, ...list].slice(0, MAX);
  simpanSemua(next);
  return next;
}

export function hapusDariRiwayat(id: string): StrukData[] {
  const next = muatRiwayat().filter((x) => x.id !== id);
  simpanSemua(next);
  return next;
}

export function kosongkanRiwayat(): StrukData[] {
  simpanSemua([]);
  return [];
}

/**
 * Simpan juga ke Supabase (tabel toll_receipts) bila env sudah diisi dan user login.
 * Gagal diam-diam: riwayat lokal tetap jadi sumber utama.
 */
export async function sinkronSupabase(d: StrukData): Promise<"ok" | "skip" | "error"> {
  if (!hasEnvVars) return "skip";
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "skip";
    const { error } = await supabase.from("toll_receipts").upsert({
      id: d.id,
      user_id: auth.user.id,
      gerbang_id: d.gerbangId,
      operator_id: d.operatorId,
      gerbang: d.gerbang,
      sub_judul: d.subJudul,
      info_tol: d.infoTol,
      lebar_kertas: d.lebarKertas === 80 ? 80 : 58,
      tanggal: new Date(d.tanggal).toISOString(),
      kode_gardu: d.kodeGardu,
      no_seri: d.noSeri,
      kode_trx: d.kodeTrx,
      sistem: d.sistem,
      asal_kode: d.asalKode || null,
      asal_nama: d.asalNama || null,
      golongan: Math.round(d.golongan),
      kartu: d.kartuLabel,
      cn: d.cn,
      tarif: Math.round(d.tarif),
      saldo: Math.round(d.saldo),
      peringatan_saldo: d.peringatanSaldo,
      gaya: d.gaya,
      lines: renderStruk(d).map((l) => barisKeTeks(l, d.lebarKertas === 80 ? 80 : 58)),
    });
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}
