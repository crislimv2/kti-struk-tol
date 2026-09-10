"use client";

import type { PrinterInfo } from "./types";

/**
 * Klien untuk agen cetak lokal (public/agent/kti-print-agent.ps1) yang berjalan di PC
 * pengguna pada http://127.0.0.1:9123. Browser mengizinkan halaman HTTPS mengakses
 * 127.0.0.1 (dianggap origin aman), jadi web di Vercel tetap bisa mencetak ke printer USB lokal.
 */
export const AGENT_URL = "http://127.0.0.1:9123";
export const AGENT_VERSION_MIN = 1;

export interface AgentInfo {
  ok: boolean;
  version: number;
  host?: string;
}

async function fetchAgen(path: string, init?: RequestInit, timeoutMs = 2500): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(`${AGENT_URL}${path}`, { ...init, signal: ctl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

/** null = agen tidak terpasang / tidak jalan di PC ini */
export async function cekAgen(): Promise<AgentInfo | null> {
  try {
    const r = await fetchAgen("/health");
    if (!r.ok) return null;
    const j = (await r.json()) as AgentInfo;
    return j.ok ? j : null;
  } catch {
    return null;
  }
}

export async function daftarPrinterAgen(): Promise<PrinterInfo[]> {
  try {
    const r = await fetchAgen("/printers");
    if (!r.ok) return [];
    const j = (await r.json()) as { printers?: PrinterInfo[] };
    return j.printers ?? [];
  } catch {
    return [];
  }
}

export async function cetakViaAgen(
  printer: string,
  dataBase64: string,
  docName: string,
): Promise<{ ok: boolean; message: string; bytes?: number }> {
  try {
    const r = await fetchAgen(
      "/print",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ printer, data: dataBase64, docName }),
      },
      30_000,
    );
    const j = (await r.json()) as { ok: boolean; message?: string; bytes?: number };
    return { ok: j.ok, message: j.message ?? (j.ok ? "Terkirim" : "Gagal"), bytes: j.bytes };
  } catch (e) {
    return { ok: false, message: `Agen cetak tidak merespons: ${(e as Error).message}` };
  }
}
