# Daftarkan task "KTI Struk Tol" di Task Scheduler: jalan otomatis saat user ini logon,
# tanpa jendela terminal. Hapus dengan: npm run autostart:remove
# Pemakaian: npm run autostart:install
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$taskName = "KTI Struk Tol"
$startScript = Join-Path $root "scripts\prod-start.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`"" `
  -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650)

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Server web KTI Struk Tol (Next.js produksi) untuk printer thermal XS-80BT" | Out-Null

Write-Host "Task '$taskName' terdaftar: jalan otomatis saat logon $env:USERNAME."
Write-Host "Mulai sekarang tanpa menunggu logon ulang: Start-ScheduledTask -TaskName '$taskName'"
