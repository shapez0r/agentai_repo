# PowerShell script for automatic check of the word 'Tester' in deployed HTML/JS on GitHub Pages
# Automatically finds the current main.js path from build/asset-manifest.json

# 1. Get main.js name from asset-manifest.json
$manifestPath = Join-Path $PSScriptRoot 'build/asset-manifest.json'
if (!(Test-Path $manifestPath)) {
    Write-Host "ERROR: File $manifestPath not found. Run build first."
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$mainJsRel = $manifest.files.'main.js'
if (-not $mainJsRel) {
    Write-Host "ERROR: main.js path not found in asset-manifest.json."
    exit 1
}

# 2. Build full URL for check
$baseUrl = "https://shapez0r.github.io"
$jsUrl = "$baseUrl$mainJsRel"
$expected = 'Tester'
$timeoutSec = 120
$intervalSec = 5
$start = Get-Date
$found = $false

Write-Host "Checking URL: $jsUrl for word '$expected'"

while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    if ($content -match $expected) {
        Write-Host "FOUND"
        $found = $true
        break
    } else {
        Write-Host "Not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: Word '$expected' not found in $timeoutSec seconds."
    exit 1
}
