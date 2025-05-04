# PowerShell script for automatic check of the word 'Conntester' or 'КоннТестер' in deployed HTML/JS on GitHub Pages
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

# Get current commit hash
$commitHash = git rev-parse HEAD

# 2. Build full URL for check
$baseUrl = "https://shapez0r.github.io"
$jsUrl = "$baseUrl$mainJsRel"
$expected1 = 'Conntester'
$expected2 = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Default.GetBytes("КоннТестер"))
$expected3 = $commitHash
$timeoutSec = 40
$intervalSec = 5
$start = Get-Date
$found = $false

# Check for commit hash first
Write-Host "Checking URL: $jsUrl for commit hash $expected3"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    if ($content -match $expected3) {
        Write-Host "Commit hash FOUND"
        $found = $true
        break
    } else {
        Write-Host "Commit hash not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: Commit hash not found in $timeoutSec seconds."
    exit 1
}

# Reset timer for the next check
$start = Get-Date
$found = $false

# Check for expected words
Write-Host "Checking URL: $jsUrl for word '$expected1' or '$expected2'"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    if ($content -match $expected1 -or $content -match $expected2) {
        Write-Host "Words FOUND"
        $found = $true
        break
    } else {
        Write-Host "Words not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: Required words not found in $timeoutSec seconds."
    exit 1
}
