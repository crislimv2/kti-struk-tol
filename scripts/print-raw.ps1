# Kirim byte mentah (ESC/POS) ke printer Windows lewat winspool RAW datatype.
# Tidak perlu share printer, tidak perlu modul native npm.
# Pemakaian: powershell -NoProfile -ExecutionPolicy Bypass -File print-raw.ps1 -Printer "POS80" -File "C:\path\job.bin" [-DocName "Struk Tol"]
param(
  [Parameter(Mandatory = $true)][string]$Printer,
  [Parameter(Mandatory = $true)][string]$File,
  [string]$DocName = "Struk Tol"
)

$ErrorActionPreference = "Stop"

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
            di.pDocName = docName;
            di.pDataType = "RAW";
            if (!StartDocPrinter(hPrinter, 1, di))
                throw new Exception("StartDocPrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
            try
            {
                if (!StartPagePrinter(hPrinter))
                    throw new Exception("StartPagePrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
                IntPtr p = Marshal.AllocCoTaskMem(bytes.Length);
                try
                {
                    Marshal.Copy(bytes, 0, p, bytes.Length);
                    int written;
                    if (!WritePrinter(hPrinter, p, bytes.Length, out written))
                        throw new Exception("WritePrinter gagal (Win32 " + Marshal.GetLastWin32Error() + ")");
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

try {
  if (-not ("RawPrinter" -as [type])) { Add-Type -TypeDefinition $code -Language CSharp }
  $bytes = [System.IO.File]::ReadAllBytes($File)
  $written = [RawPrinter]::Send($Printer, $bytes, $DocName)
  Write-Output (@{ ok = $true; printer = $Printer; bytes = $written } | ConvertTo-Json -Compress)
  exit 0
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
  Write-Output (@{ ok = $false; printer = $Printer; message = $msg } | ConvertTo-Json -Compress)
  exit 1
}
