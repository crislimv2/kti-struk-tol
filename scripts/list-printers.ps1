# Daftar printer Windows sebagai JSON: [{name, port, status}]
$ErrorActionPreference = "Stop"
try {
  $list = @(Get-Printer | ForEach-Object {
    @{ name = $_.Name; port = [string]$_.PortName; status = [string]$_.PrinterStatus }
  })
  Write-Output (ConvertTo-Json -InputObject $list -Compress)
} catch {
  Write-Output "[]"
}
