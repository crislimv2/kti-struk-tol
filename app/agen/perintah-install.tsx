"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/** Perintah satu baris pemasangan agen; URL mengikuti domain tempat halaman ini dibuka. */
export function PerintahInstall() {
  const [origin, setOrigin] = useState("https://kti-struk-tol.vercel.app");
  const [disalin, setDisalin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin.startsWith("http")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron dari window setelah mount
      setOrigin(window.location.origin);
    }
  }, []);
  const perintah = `powershell -ExecutionPolicy Bypass -Command "irm ${origin}/agent/install.ps1 | iex"`;

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(perintah);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 2000);
    } catch {
      /* clipboard tidak tersedia; pengguna bisa seleksi manual */
    }
  };

  return (
    <div className="flex items-start gap-2">
      <pre className="flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 text-xs">
        <code>{perintah}</code>
      </pre>
      <Button type="button" variant="outline" size="icon" onClick={salin} title="Salin perintah">
        {disalin ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}
