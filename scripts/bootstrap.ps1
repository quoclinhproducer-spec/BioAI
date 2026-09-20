$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'
$exampleFile = Join-Path $root '.env.example'
$mosquittoDir = Join-Path $root 'mosquitto\config'

if (-not (Test-Path $envFile) -and (Test-Path $exampleFile)) {
    Copy-Item $exampleFile $envFile
    $content = Get-Content $envFile
    $content = $content -replace 'JWT_SECRET=.*', ('JWT_SECRET={0}' -f ([Convert]::ToHexString((New-Object byte[] 32))))
    $content = $content -replace 'REFRESH_SECRET=.*', ('REFRESH_SECRET={0}' -f ([Convert]::ToHexString((New-Object byte[] 32))))
    $content = $content -replace 'POSTGRES_PASSWORD=.*', ('POSTGRES_PASSWORD={0}' -f ([Convert]::ToHexString((New-Object byte[] 16))))
    $content = $content -replace 'MQTT_PASSWORD=.*', ('MQTT_PASSWORD={0}' -f ([Convert]::ToHexString((New-Object byte[] 8))))
    Set-Content -Path $envFile -Value $content
}

New-Item -ItemType Directory -Force -Path $mosquittoDir | Out-Null
if (-not (Test-Path (Join-Path $mosquittoDir 'mosquitto.passwd'))) {
    New-Item -ItemType File -Path (Join-Path $mosquittoDir 'mosquitto.passwd') | Out-Null
}

Write-Host 'Bootstrap complete. Review .env before starting Docker.'
