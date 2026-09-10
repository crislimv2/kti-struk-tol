# Web-installer Agen Cetak KTI Struk Tol. Dijalankan langsung dari PowerShell tanpa mengunduh
# file secara manual (tidak kena blokir SmartScreen / Mark-of-the-Web):
#
#   powershell -ExecutionPolicy Bypass -Command "irm https://kti-struk-tol.vercel.app/agent/install.ps1 | iex"
#
# Skrip ini mengunduh kti-print-agent.ps1 + uninstall-agent.ps1 ke %LOCALAPPDATA%\KTI Struk Tol,
# mendaftarkan Task Scheduler (jalan saat logon, tanpa jendela), lalu langsung menjalankannya.
param([string]$Base = "https://kti-struk-tol.vercel.app/agent")

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$taskName = "KTI Struk Tol Print Agent"
$dest = Join-Path $env:LOCALAPPDATA "KTI Struk Tol"
New-Item -ItemType Directory -Force $dest | Out-Null

Write-Host "Mengunduh agen dari $Base ..."
foreach ($f in @("kti-print-agent.ps1", "uninstall-agent.ps1")) {
  $out = Join-Path $dest $f
  Invoke-WebRequest -Uri "$Base/$f" -OutFile $out -UseBasicParsing
  Unblock-File $out -ErrorAction SilentlyContinue
}

$agent = Join-Path $dest "kti-print-agent.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$agent`"" -WorkingDirectory $dest
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650)

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}
# hentikan agen lama yang mungkin masih jalan (port 9123)
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
  Where-Object { $_.CommandLine -like "*kti-print-agent.ps1*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Meneruskan struk dari web KTI Struk Tol ke printer thermal USB (http://127.0.0.1:9123)" | Out-Null
Start-ScheduledTask -TaskName $taskName

Start-Sleep -Seconds 3
try {
  $r = Invoke-RestMethod -Uri "http://127.0.0.1:9123/health" -TimeoutSec 5
  Write-Host ""
  Write-Host "Agen cetak terpasang dan berjalan (versi $($r.version)) di http://127.0.0.1:9123" -ForegroundColor Green
  Write-Host "Muat ulang halaman KTI Struk Tol; printer Anda akan muncul di daftar."
} catch {
  Write-Host ""
  Write-Host "Agen terdaftar, tetapi belum merespons. Coba logout/login, atau jalankan manual:" -ForegroundColor Yellow
  Write-Host "  powershell -ExecutionPolicy Bypass -File `"$agent`""
}
Write-Host "Folder: $dest   Log: $dest\agent.log"
