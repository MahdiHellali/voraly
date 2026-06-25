# Build du paquet Chrome Web Store (Windows) : zippe l'extension sans dev files.
# Usage : powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$out = Join-Path $PSScriptRoot 'voraly-extension.zip'
if (Test-Path $out) { Remove-Item $out -Force }

$items = @('manifest.json', 'icons', 'src', 'PRIVACY.md')
Compress-Archive -Path $items -DestinationPath $out -CompressionLevel Optimal

Write-Host "OK -> $out"
Get-ChildItem $out | Select-Object Name, Length
