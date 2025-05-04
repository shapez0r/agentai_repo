# PowerShell script for automatic check of the word 'Supertester' or 'СуперТестер' in deployed HTML/JS on GitHub Pages
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
$expected1 = 'Supertester'
$expected2 = "СуперТестер"
$expected3 = 'Supertester' # Spanish (kept in English)
$expected4 = 'Supertester' # German (kept in English)
$expectedRegions = @('Cloudflare', 'Singapore')
$timeoutSec = 40
$intervalSec = 5
$start = Get-Date
$found = $false

# Check for commit hash first
Write-Host "Checking URL: $jsUrl for commit hash $commitHash"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    if ($content -match $commitHash) {
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
Write-Host "Checking URL: $jsUrl for words in all languages"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    if ($content -match $expected1 -or $content -match $expected2 -or $content -match $expected3 -or $content -match $expected4) {
        Write-Host "Words FOUND in all languages"
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

# Reset timer for the next check
$start = Get-Date
$found = $false

# Check for expected region names
Write-Host "Checking URL: $jsUrl for region names"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    $found = $false
    foreach ($region in $expectedRegions) {
        if ($content -match $region) {
            Write-Host "Region FOUND: $region"
            $found = $true
        } else {
            Write-Host "Region NOT found: $region"
        }
    }
    if ($found) {
        break
    } else {
        Write-Host "Regions not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: Required regions not found in $timeoutSec seconds."
    exit 1
}
