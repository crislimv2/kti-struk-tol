import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { PerintahInstall } from "./perintah-install";

export const metadata = {
  title: "Pasang Agen Cetak - KTI Struk Tol",
};

/** Panduan pemasangan agen cetak lokal untuk pengguna (PC Windows yang tersambung ke printer). */
export default function AgenPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Kembali ke struk
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Pasang Agen Cetak</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Web ini berjalan di internet, sedangkan printer thermal ada di komputer Anda. Agen cetak adalah
        program kecil yang berjalan di komputer Anda dan meneruskan struk dari web ke printer lewat USB.
        Pemasangan cukup sekali, setelah itu otomatis hidup setiap komputer menyala.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cara 1 (disarankan): satu perintah, tanpa unduh file</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Pastikan printer thermal sudah terpasang di Windows dan bisa mencetak test page
              (Settings &gt; Bluetooth &amp; devices &gt; Printers &amp; scanners).
            </li>
            <li>
              Buka PowerShell: tekan <kbd>Win</kbd>+<kbd>X</kbd> lalu pilih <strong>Terminal</strong> atau{" "}
              <strong>Windows PowerShell</strong> (tidak perlu Administrator).
            </li>
            <li>Salin perintah di bawah, tempel di PowerShell, tekan Enter.</li>
          </ol>
          <PerintahInstall />
          <p className="text-muted-foreground">
            Perintah ini mengunduh agen langsung dari situs ini ke folder pengguna, mendaftarkannya agar
            hidup otomatis saat logon, lalu menjalankannya. Tidak ada file yang &quot;diunduh dari internet&quot;
            secara manual, sehingga tidak kena blokir SmartScreen, dan Execution Policy dilewati hanya
            untuk perintah ini.
          </p>
          <p>
            Setelah tertulis <strong>&quot;Agen cetak terpasang dan berjalan&quot;</strong>, kembali ke halaman
            struk dan muat ulang. Printer Anda akan tampil di daftar Printer.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cara 2: unduh file lalu klik dua kali</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <p>
            Unduh empat file berikut ke satu folder yang sama, lalu klik dua kali{" "}
            <code>Pasang-Agen-Cetak.cmd</code>. Bila SmartScreen menampilkan &quot;Windows protected your
            PC&quot;, klik <strong>More info</strong> lalu <strong>Run anyway</strong>. Launcher .cmd ini
            membuka blokir file dan melewati Execution Policy secara otomatis.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <a href="/agent/Pasang-Agen-Cetak.cmd" download>
                <Download className="size-4" /> Pasang-Agen-Cetak.cmd
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/agent/install-agent.ps1" download>
                <Download className="size-4" /> install-agent.ps1
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/agent/kti-print-agent.ps1" download>
                <Download className="size-4" /> kti-print-agent.ps1
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/agent/uninstall-agent.ps1" download>
                <Download className="size-4" /> uninstall-agent.ps1
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pengaturan driver printer yang disarankan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Untuk printer dengan driver &quot;POS80 Printer&quot;: buka Printing Preferences, tab{" "}
            <strong>PaperSave</strong> naikkan semua nilai ke maksimum (agar ruang kosong di struk tidak
            dipangkas), tab <strong>Cutter</strong> pilih &quot;Feed And HalfCut (From PrintHead To Cutter)&quot;.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Keamanan &amp; cara kerja</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Agen hanya menerima koneksi dari komputer itu sendiri (127.0.0.1, port 9123).</li>
            <li>Tidak ada data yang dikirim ke luar; web hanya mengirim byte cetak ke agen.</li>
            <li>Agen berupa skrip PowerShell terbuka, bisa dibaca isinya, tanpa instalasi program lain.</li>
            <li>
              Menghapus: jalankan <code>uninstall-agent.ps1</code>, atau hapus task &quot;KTI Struk Tol Print
              Agent&quot; di Task Scheduler.
            </li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
