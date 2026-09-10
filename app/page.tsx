import { AuthButton } from "@/components/auth-button";
import { StrukAppLoader } from "@/components/struk/struk-app-loader";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DEFAULT_UNIT } from "@/lib/struk/presets";
import { hasEnvVars } from "@/lib/utils";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="flex h-14 w-full justify-center border-b border-b-foreground/10">
        <div className="flex w-full max-w-6xl items-center justify-between px-5 text-sm">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Receipt className="size-4" />
            KTI Struk Tol
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Default unit: {DEFAULT_UNIT.nama} · Gol {DEFAULT_UNIT.golongan}
            </span>
            <Link href="/agen" className="text-xs underline-offset-4 hover:underline">
              Pasang Agen Cetak
            </Link>
            {hasEnvVars && (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Cetak Struk Gerbang Tol</h1>
          <p className="text-sm text-muted-foreground">
            Isi data transaksi, cek pratinjau, lalu cetak ke printer thermal 80mm (Iware XS-80BT).
          </p>
        </header>
        <StrukAppLoader />
      </div>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Kristal Transport Indonesia · Format mengikuti struk GTO Jasa Marga / JTT / Astra Infra
      </footer>
    </main>
  );
}
