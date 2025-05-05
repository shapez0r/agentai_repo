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
$cssUrl = "$baseUrl$($manifest.files.'main.css')"

# Define features to check - each feature must have an ID, name, and search pattern
$featuresToCheck = @(
    @{
        ID = 1
        Name = "English title 'Supertester'"
        Pattern = 'Supertester'
        Category = "Multi-language Support"
    },
    @{
        ID = 2
        Name = "Russian title"
        Pattern = 'ru.{0,20}connectionTester|connectionTester.{0,20}ru|ru.{0,30}Tester'
        Category = "Multi-language Support"
    },
    @{
        ID = 3
        Name = "Spanish title (Supertester)"
        Pattern = 'es.*Supertester|Supertester.*es'
        Category = "Multi-language Support"
    },
    @{
        ID = 4
        Name = "German title (Supertester)"
        Pattern = 'de.*Supertester|Supertester.*de'
        Category = "Multi-language Support"
    },
    @{
        ID = 5
        Name = "Rainbow title CSS class"
        Pattern = 'rainbow-title'
        Category = "Visual Effects"
    },
    @{
        ID = 6
        Name = "Rainbow animation effect"
        Pattern = 'rainbow-text'
        Category = "Visual Effects"
    },
    @{
        ID = 7
        Name = "New York city"
        Pattern = 'New\s*York'
        Category = "Cities"
    },
    @{
        ID = 8
        Name = "London city"
        Pattern = 'London'
        Category = "Cities"
    },
    @{
        ID = 9
        Name = "Sydney city"
        Pattern = 'Sydney'
        Category = "Cities"
    },
    @{
        ID = 10
        Name = "Singapore city"
        Pattern = 'Singapore'
        Category = "Cities"
    },
    @{
        ID = 11
        Name = "Frankfurt city"
        Pattern = 'Frankfurt'
        Category = "Cities"
    },
    @{
        ID = 12
        Name = "Mumbai city"
        Pattern = 'Mumbai'
        Category = "Cities"
    },
    @{
        ID = 13
        Name = "Sao Paulo city"
        Pattern = 'Sao\s*Paulo'
        Category = "Cities"
    },
    @{
        ID = 14
        Name = "Tokyo city"
        Pattern = 'Tokyo'
        Category = "Cities"
    },
    @{
        ID = 15
        Name = "Johannesburg city"
        Pattern = 'Johannesburg'
        Category = "Cities"
    },
    @{
        ID = 16
        Name = "Toronto city"
        Pattern = 'Toronto'
        Category = "Cities"
    },
    @{
        ID = 17
        Name = "Map container"
        Pattern = 'map-container'
        Category = "Map Features"
    },
    @{
        ID = 18
        Name = "Leaflet integration"
        Pattern = 'leaflet|MapContainer'
        Category = "Map Features"
    },
    @{
        ID = 19
        Name = "Map markers"
        Pattern = 'Marker|position'
        Category = "Map Features"
    },
    @{
        ID = 20
        Name = "Coordinates for cities"
        Pattern = 'coords'
        Category = "Map Features"
    },
    @{
        ID = 21
        Name = "Map error boundary"
        Pattern = 'MapErrorBoundary|ErrorBoundary'
        Category = "Map Features"
    },
    @{
        ID = 22
        Name = "Map view toggle"
        Pattern = 'Map View|showMapView'
        Category = "Map Features"
    },
    @{
        ID = 23
        Name = "List view toggle"
        Pattern = 'List View'
        Category = "Map Features"
    },
    @{
        ID = 24
        Name = "Cloudflare server"
        Pattern = 'Cloudflare'
        Category = "Servers"
    },
    @{
        ID = 25
        Name = "Singapore server"
        Pattern = 'Singapore'
        Category = "Servers"
    },
    @{
        ID = 26
        Name = "Improved ping measurement"
        Pattern = 'pingServer|Promise\.race|Unreachable'
        Category = "Ping Features"
    },
    @{
        ID = 27
        Name = "Multiple ping attempts"
        Pattern = 'for\s*\(.+\<\s*3'
        Category = "Ping Features"
    },
    @{
        ID = 28
        Name = "Ping timeout handling"
        Pattern = 'timeout|setTimeout.+reject'
        Category = "Ping Features"
    }
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
        Write-Host "Commit hash FOUND: $commitHash" -ForegroundColor Green
        $found = $true
        break
    } else {
        Write-Host "Commit hash not found yet, retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds $intervalSec
    }
}

if (-not $found) {
    Write-Host "ERROR: Commit hash not found in $timeoutSec seconds." -ForegroundColor Red
    exit 1
}

# Reset timer for the next check
$start = Get-Date
$found = $false

# Get JS and CSS content
$jsContent = curl.exe -s $jsUrl
$cssContent = curl.exe -s $cssUrl

# Check for all features
Write-Host "`n============ FEATURE CHECK RESULTS ============" -ForegroundColor Cyan
Write-Host "Checking deployed files for required features..."
$categoryCounts = @{}
$foundFeatures = 0
$totalFeatures = $featuresToCheck.Count

foreach ($feature in $featuresToCheck) {
    $content = $jsContent
    # For CSS-specific features, check CSS content too
    if ($feature.Category -eq "Visual Effects") {
        $content = $jsContent + $cssContent
    }
    
    if ($content -match $feature.Pattern) {
        Write-Host "[OK] Feature #$($feature.ID): $($feature.Name)" -ForegroundColor Green
        $foundFeatures++
        
        # Track category stats
        if ($categoryCounts.ContainsKey($feature.Category)) {
            $categoryCounts[$feature.Category]++
        } else {
            $categoryCounts[$feature.Category] = 1
        }
    } else {
        Write-Host "[FAIL] Feature #$($feature.ID): $($feature.Name) - NOT FOUND" -ForegroundColor Red
    }
}

# Display summary
Write-Host "`n============ TEST SUMMARY ============" -ForegroundColor Cyan
Write-Host "Features found: $foundFeatures of $totalFeatures" -ForegroundColor $(if ($foundFeatures -eq $totalFeatures) { "Green" } else { "Red" })
Write-Host "`nBy category:"
foreach ($category in $categoryCounts.Keys) {
    $categoryTotal = ($featuresToCheck | Where-Object { $_.Category -eq $category }).Count
    $categoryFound = $categoryCounts[$category]
    $color = if ($categoryFound -eq $categoryTotal) { "Green" } elseif ($categoryFound -gt 0) { "Yellow" } else { "Red" }
    Write-Host "- $category`: $categoryFound of $categoryTotal" -ForegroundColor $color
}

if ($foundFeatures -eq $totalFeatures) {
    Write-Host "`nTEST PASSED: All features found successfully" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nTEST FAILED: Not all features were found" -ForegroundColor Red
    exit 1
}
