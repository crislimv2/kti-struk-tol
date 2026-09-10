# Build produksi ke folder .next-prod (tidak mengganggu dev server yang memakai .next).
# Pemakaian: npm run prod:build
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:STRUK_DIST_DIR = ".next-prod"
Write-Host "Build produksi -> .next-prod ..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "next build gagal (exit $LASTEXITCODE)" }
Write-Host "Selesai. Jalankan: npm run prod:start"
