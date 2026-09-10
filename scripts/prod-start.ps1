# Jalankan build produksi (.next-prod) di port STRUK_PORT (default 3000).
# Pemakaian: npm run prod:start   (atau dipanggil Task Scheduler saat logon, lihat install-autostart.ps1)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$env:STRUK_DIST_DIR = ".next-prod"
if (-not $env:STRUK_PORT) { $env:STRUK_PORT = "3000" }
$env:PORT = $env:STRUK_PORT
$env:NODE_ENV = "production"

if (-not (Test-Path (Join-Path $root ".next-prod\BUILD_ID"))) {
  throw "Belum ada build produksi. Jalankan dulu: npm run prod:build"
}

$log = Join-Path $root "logs"
New-Item -ItemType Directory -Force $log | Out-Null
$stamp = Get-Date -Format "yyyyMMdd"
Write-Host "KTI Struk Tol produksi di http://localhost:$($env:PORT)  (log: logs\server-$stamp.log)"
# next start dijalankan langsung (bukan lewat npm) supaya PID-nya milik proses ini
& node (Join-Path $root "node_modules\next\dist\bin\next") start -p $env:PORT 2>&1 |
  Tee-Object -FilePath (Join-Path $log "server-$stamp.log") -Append
