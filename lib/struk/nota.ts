import type { SpbuData } from "@/lib/spbu/types";
import type { StrukData } from "./types";

/** Semua jenis nota yang bisa dicetak aplikasi. `jenis` = diskriminan; tol lama tanpa jenis dianggap "tol". */
export type NotaData = StrukData | SpbuData;

export function adalahSpbu(n: NotaData): n is SpbuData {
  return (n as SpbuData).jenis === "spbu";
}

export function adalahTol(n: NotaData): n is StrukData {
  return !adalahSpbu(n);
}
