import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

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
          <CardTitle>Langkah pemasangan (Windows 10/11)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              Pastikan printer thermal sudah terpasang di Windows dan bisa mencetak test page
              (Settings &gt; Bluetooth &amp; devices &gt; Printers &amp; scanners).
            </li>
            <li>
              Unduh tiga file di bawah ini ke satu folder yang sama, misalnya <code>Downloads\AgenCetak</code>.
            </li>
            <li>
              Klik kanan <code>install-agent.ps1</code> lalu pilih <strong>Run with PowerShell</strong>. Bila
              muncul peringatan keamanan, pilih Open / Run anyway. Tunggu sampai tertulis
              &quot;Agen cetak terpasang dan berjalan&quot;.
            </li>
            <li>
              Kembali ke halaman struk dan muat ulang. Printer Anda akan tampil di daftar Printer dan
              tombol <strong>Cetak ESC/POS</strong> langsung mencetak ke printer tersebut.
            </li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <a href="/agent/kti-print-agent.ps1" download>
                <Download className="size-4" /> kti-print-agent.ps1
              </a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/agent/install-agent.ps1" download>
                <Download className="size-4" /> install-agent.ps1
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
