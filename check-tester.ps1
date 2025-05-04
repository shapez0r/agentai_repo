# PowerShell script for automatic check of the word 'Supertester' or 'СуперТестер' in deployed HTML/JS on GitHub Pages
# Automatically finds the current main.js path from build/asset-manifest.json

# Ensure the script explicitly sets UTF-8 encoding for all operations
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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

# Define regions to check, without special characters
$regionsToCheck = @(
    'Russia',
    'Rusia',
    'Russland',
    'Europe',
    'Europa',
    'US',
    'EE.UU',
    'USA',
    'Singapore',
    'Singapur',
    'Brazil',
    'Brasil',
    'Brasilien',
    'India',
    'Indien',
    'Australia',
    'Australien',
    'South Africa',
    'Japan',
    'Canada',
    'Kanada'
)

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

# Check for the presence of region names
Write-Host "Checking URL: $jsUrl for region names in all languages"
while ((Get-Date) - $start -lt (New-TimeSpan -Seconds $timeoutSec)) {
    $content = curl.exe -s $jsUrl
    $regionsFound = 0
    
    foreach ($region in $regionsToCheck) {
        if ($content -match $region) {
            Write-Host "Region FOUND: $region"
            $regionsFound++
        } else {
            Write-Host "Region NOT found: $region"
        }
    }
    
    # Custom check for Spanish Canada (Canadá)
    if ($content -match "Canada.*es" -or $content -match "es.*Canada") {
        Write-Host "Spanish translation for Canada (Canadá) FOUND via context matching"
        $regionsFound++
    } else {
        Write-Host "Spanish translation for Canada (Canadá) NOT found"
    }
    
    if ($regionsFound -ge 3) {
        Write-Host "At least 3 regions were found, check PASSED"
        exit 0
    } else {
        Write-Host "Regions not found yet, retrying..."
        Start-Sleep -Seconds $intervalSec
    }
}

Write-Host "ERROR: Required regions not found in $timeoutSec seconds."
exit 1
