# Hapus Agen Cetak KTI Struk Tol (task autostart + file di %LOCALAPPDATA%\KTI Struk Tol).
$ErrorActionPreference = "Stop"
$taskName = "KTI Struk Tol Print Agent"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "Task '$taskName' dihapus."
}
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
  Where-Object { $_.CommandLine -like "*kti-print-agent.ps1*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
$dest = Join-Path $env:LOCALAPPDATA "KTI Struk Tol"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Write-Host "Agen cetak dihapus. Tekan Enter untuk menutup."
[void][Console]::ReadLine()
