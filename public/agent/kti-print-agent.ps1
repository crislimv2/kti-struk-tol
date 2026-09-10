# KTI Struk Tol - Agen Cetak Lokal (versi 1)
# ------------------------------------------------------------------
# Server HTTP kecil di http://127.0.0.1:9123 yang menerima byte ESC/POS dari web
# KTI Struk Tol dan meneruskannya ke printer Windows (RAW, lewat winspool).
# Tidak butuh Node, driver tambahan, atau hak admin. Hanya menerima koneksi dari PC ini.
#
# Pemakaian manual : powershell -NoProfile -ExecutionPolicy Bypass -File kti-print-agent.ps1
# Autostart        : jalankan install-agent.ps1 (Task Scheduler saat logon, tanpa jendela)
#
# Endpoint:
#   GET  /health    -> {"ok":true,"version":1,"host":"NAMA-PC"}
#   GET  /printers  -> {"printers":[{"name":..,"port":..,"status":..}]}
#   POST /print     -> body {"printer":"POS80","data":"<base64 ESC/POS>","docName":"..."}
param([int]$Port = 9123)

$ErrorActionPreference = "Stop"
$VERSION = 1
$logDir = Join-Path $env:LOCALAPPDATA "KTI Struk Tol"
New-Item -ItemType Directory -Force $logDir | Out-Null
$logFile = Join-Path $logDir "agent.log"
function Log($msg) {
  $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Host $line
}

# ---- winspool RAW (sama seperti scripts/print-raw.ps1 di repo) ----
$code = @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFOW
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPWStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOW di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);
    public static int Send(string printerName, byte[] bytes, string docName)
    {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
            throw new Exception("OpenPrinter gagal (Win32 " + Marshal.GetLastWin32Error() + "). Nama printer: " + printerName);
        try
        {
            DOCINFOW di = new DOCINFOW();
            di.pDocName = docName; di.pDataType = "RAW";
            if (!StartDocPrinter(hPrinter, 1, di)) throw new Exception("StartDocPrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
            try
            {
                if (!StartPagePrinter(hPrinter)) throw new Exception("StartPagePrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
                IntPtr p = Marshal.AllocCoTaskMem(bytes.Length);
                try
                {
                    Marshal.Copy(bytes, 0, p, bytes.Length);
                    int written;
                    if (!WritePrinter(hPrinter, p, bytes.Length, out written)) throw new Exception("WritePrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
                    EndPagePrinter(hPrinter);
                    return written;
                }
                finally { Marshal.FreeCoTaskMem(p); }
            }
            finally { EndDocPrinter(hPrinter); }
        }
        finally { ClosePrinter(hPrinter); }
    }
}
"@
if (-not ("RawPrinter" -as [type])) { Add-Type -TypeDefinition $code -Language CSharp }

# ---- server HTTP minimal di atas TcpListener (tidak butuh URL ACL / admin) ----
$enc = [System.Text.Encoding]::UTF8
function Json($obj) { return ($obj | ConvertTo-Json -Compress -Depth 5) }

function Respond($stream, [int]$status, [string]$body, [string]$type = "application/json") {
  $reason = switch ($status) { 200 { "OK" } 204 { "No Content" } 400 { "Bad Request" } 404 { "Not Found" } 500 { "Internal Server Error" } default { "OK" } }
  $bytes = $enc.GetBytes($body)
  $hdr = "HTTP/1.1 $status $reason`r`n" +
    "Content-Type: $type; charset=utf-8`r`n" +
    "Content-Length: $($bytes.Length)`r`n" +
    "Access-Control-Allow-Origin: *`r`n" +
    "Access-Control-Allow-Methods: GET, POST, OPTIONS`r`n" +
    "Access-Control-Allow-Headers: Content-Type`r`n" +
    "Access-Control-Allow-Private-Network: true`r`n" +
    "Access-Control-Max-Age: 600`r`n" +
    "Cache-Control: no-store`r`n" +
    "Connection: close`r`n`r`n"
  $h = $enc.GetBytes($hdr)
  $stream.Write($h, 0, $h.Length)
  if ($bytes.Length -gt 0) { $stream.Write($bytes, 0, $bytes.Length) }
  $stream.Flush()
}

function ReadRequest($stream) {
  # baca sampai akhir header, lalu body sepanjang Content-Length
  $ms = New-Object System.IO.MemoryStream
  $buf = New-Object byte[] 8192
  $headerEnd = -1
  while ($headerEnd -lt 0) {
    $n = $stream.Read($buf, 0, $buf.Length)
    if ($n -le 0) { break }
    $ms.Write($buf, 0, $n)
    $all = $ms.ToArray()
    for ($i = 3; $i -lt $all.Length; $i++) {
      if ($all[$i-3] -eq 13 -and $all[$i-2] -eq 10 -and $all[$i-1] -eq 13 -and $all[$i] -eq 10) { $headerEnd = $i + 1; break }
    }
    if ($ms.Length -gt 1MB) { break }
  }
  if ($headerEnd -lt 0) { return $null }
  $all = $ms.ToArray()
  $headerText = [System.Text.Encoding]::ASCII.GetString($all, 0, $headerEnd)
  $lines = $headerText -split "`r`n"
  $parts = $lines[0] -split " "
  $req = @{ Method = $parts[0]; Path = $parts[1]; Headers = @{}; Body = "" }
  foreach ($l in $lines[1..($lines.Length-1)]) {
    $idx = $l.IndexOf(":")
    if ($idx -gt 0) { $req.Headers[$l.Substring(0, $idx).Trim().ToLower()] = $l.Substring($idx+1).Trim() }
  }
  $len = 0
  if ($req.Headers["content-length"]) { $len = [int]$req.Headers["content-length"] }
  $have = $all.Length - $headerEnd
  $body = New-Object System.IO.MemoryStream
  if ($have -gt 0) { $body.Write($all, $headerEnd, [Math]::Min($have, $len)) }
  while ($body.Length -lt $len) {
    $n = $stream.Read($buf, 0, [Math]::Min($buf.Length, $len - $body.Length))
    if ($n -le 0) { break }
    $body.Write($buf, 0, $n)
  }
  $req.Body = $enc.GetString($body.ToArray())
  return $req
}

function Handle($req) {
  $path = ($req.Path -split "\?")[0]
  if ($req.Method -eq "OPTIONS") { return @{ Status = 204; Body = "" } }
  if ($req.Method -eq "GET" -and $path -eq "/health") {
    return @{ Status = 200; Body = (Json @{ ok = $true; version = $VERSION; host = $env:COMPUTERNAME }) }
  }
  if ($req.Method -eq "GET" -and $path -eq "/printers") {
    $list = @(Get-Printer | ForEach-Object { @{ name = $_.Name; port = [string]$_.PortName; status = [string]$_.PrinterStatus } })
    return @{ Status = 200; Body = (Json @{ printers = $list }) }
  }
  if ($req.Method -eq "POST" -and $path -eq "/print") {
    try {
      $j = $req.Body | ConvertFrom-Json
      if (-not $j.printer -or -not $j.data) { return @{ Status = 400; Body = (Json @{ ok = $false; message = "printer dan data wajib" }) } }
      $bytes = [Convert]::FromBase64String([string]$j.data)
      $doc = if ($j.docName) { [string]$j.docName } else { "Struk Tol" }
      $written = [RawPrinter]::Send([string]$j.printer, $bytes, $doc)
      Log "print ok -> $($j.printer) ($written byte) $doc"
      return @{ Status = 200; Body = (Json @{ ok = $true; message = "Terkirim ke $($j.printer) ($written byte)"; bytes = $written }) }
    } catch {
      $msg = $_.Exception.Message
      if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
      Log "print gagal: $msg"
      return @{ Status = 500; Body = (Json @{ ok = $false; message = $msg }) }
    }
  }
  return @{ Status = 404; Body = (Json @{ ok = $false; message = "tidak ada: $($req.Method) $path" }) }
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Log "Agen cetak KTI Struk Tol v$VERSION siap di http://127.0.0.1:$Port"
while ($true) {
  $client = $null
  try {
    $client = $listener.AcceptTcpClient()
    $client.ReceiveTimeout = 10000
    $stream = $client.GetStream()
    $req = ReadRequest $stream
    if ($req) {
      $res = Handle $req
      Respond $stream $res.Status $res.Body
    }
  } catch {
    Log "error: $($_.Exception.Message)"
  } finally {
    if ($client) { $client.Close() }
  }
}
