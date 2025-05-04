# PowerShell script for automatic check of black background in deployed CSS on GitHub Pages
# Automatically finds the current main.css path from build/asset-manifest.json

# 1. Get main.css name from asset-manifest.json
$manifestPath = Join-Path $PSScriptRoot 'build/asset-manifest.json'
if (!(Test-Path $manifestPath)) {
    Write-Host "ERROR: File $manifestPath not found. Run build first."
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$mainCssRel = $manifest.files.'main.css'
if (-not $mainCssRel) {
    Write-Host "ERROR: main.css path not found in asset-manifest.json."
    exit 1
}

# 2. Build full URL for check
$baseUrl = "https://shapez0r.github.io"
$cssUrl = "$baseUrl$mainCssRel"
$expected1 = 'background:#000;'
$expected2 = 'background:#000000'
$timeoutSec = 120
$intervalSec = 5
$start = Get-Date
$found = $false

Write-Host "Checking URL: $cssUrl"

while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $cssUrl
    if ($content -match $expected1 -or $content -match $expected2) {
        Write-Host "FOUND"
        $found = $true
        break
    } else {
        Write-Host "Not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: background:#000; or background:#000000 not found in $timeoutSec seconds."
    exit 1
}
