# Hapus task autostart "KTI Struk Tol" dan hentikan server produksi yang sedang jalan.
# Pemakaian: npm run autostart:remove
$ErrorActionPreference = "Stop"
$taskName = "KTI Struk Tol"
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "Task '$taskName' dihapus."
} else {
  Write-Host "Task '$taskName' tidak ada."
}
