# Pasang Agen Cetak KTI Struk Tol: salin ke %LOCALAPPDATA%\KTI Struk Tol, daftarkan
# Task Scheduler (jalan saat logon, tanpa jendela), lalu langsung jalankan.
# Cara pakai: klik kanan file ini > Run with PowerShell   (atau: powershell -ExecutionPolicy Bypass -File install-agent.ps1)
$ErrorActionPreference = "Stop"
$taskName = "KTI Struk Tol Print Agent"
$dest = Join-Path $env:LOCALAPPDATA "KTI Struk Tol"
New-Item -ItemType Directory -Force $dest | Out-Null

$src = Join-Path $PSScriptRoot "kti-print-agent.ps1"
if (-not (Test-Path $src)) { throw "kti-print-agent.ps1 harus ada di folder yang sama dengan installer ini." }
Copy-Item $src (Join-Path $dest "kti-print-agent.ps1") -Force
Copy-Item (Join-Path $PSScriptRoot "uninstall-agent.ps1") (Join-Path $dest "uninstall-agent.ps1") -Force -ErrorAction SilentlyContinue

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
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Meneruskan struk dari web KTI Struk Tol ke printer thermal USB (http://127.0.0.1:9123)" | Out-Null
Start-ScheduledTask -TaskName $taskName

Start-Sleep -Seconds 3
try {
  $r = Invoke-RestMethod -Uri "http://127.0.0.1:9123/health" -TimeoutSec 5
  Write-Host ""
  Write-Host "Agen cetak terpasang dan berjalan (versi $($r.version)) di http://127.0.0.1:9123" -ForegroundColor Green
  Write-Host "Buka kembali web KTI Struk Tol, printer Anda akan muncul di daftar."
} catch {
  Write-Host ""
  Write-Host "Agen terdaftar, tetapi belum merespons. Coba logout/login, atau jalankan manual:" -ForegroundColor Yellow
  Write-Host "  powershell -ExecutionPolicy Bypass -File `"$agent`""
}
Write-Host "Log: $dest\agent.log"
Write-Host "Tekan Enter untuk menutup."
[void][Console]::ReadLine()
