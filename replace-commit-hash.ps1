# Super simple PowerShell script to update the commit hash in App.js
# This script focuses on finding the exact line with the version string and updating it

# Get current commit hash
$commitHash = git rev-parse HEAD
Write-Host "Using commit hash: $commitHash"

# Set App.js path
$appJsPath = Join-Path $PSScriptRoot "src\App.js"

# Check if the file exists
if (-not (Test-Path $appJsPath)) {
    Write-Host "ERROR: App.js file not found at $appJsPath"
    exit 1
}

# Read the entire file
$content = Get-Content -Path $appJsPath -Raw

# Check encoding of App.js before writing
$encoding = (Get-Content -Path $appJsPath -Encoding Byte -Raw)[0..2]
if ($encoding[0] -eq 0xEF -and $encoding[1] -eq 0xBB -and $encoding[2] -eq 0xBF) {
    Write-Host "INFO: App.js has a UTF-8 BOM."
} else {
    Write-Host "INFO: App.js does not have a UTF-8 BOM. (This is normal for web projects)"
}

# Look for the VERSION constant line
if ($content -match 'const VERSION = ".*?"') {
    Write-Host "Found VERSION constant in App.js"
    
    # Replace the version string directly - no regex complexity
    $newContent = $content -replace 'const VERSION = ".*?"', "const VERSION = `"$commitHash`""
    
    # Write back to the file with UTF-8 encoding without BOM
    [System.IO.File]::WriteAllText($appJsPath, $newContent, [System.Text.UTF8Encoding]::new($false))
    
    # Verify the change
    $updatedContent = Get-Content -Path $appJsPath -Raw
    if ($updatedContent -like "*const VERSION = `"$commitHash`"*") {
        Write-Host "SUCCESS: Commit hash updated successfully!"
        exit 0
    } else {
        Write-Host "ERROR: Failed to update commit hash."
        exit 2
    }
} else {
    Write-Host "ERROR: Could not find VERSION constant in App.js"
    Write-Host "Ensure App.js contains a line with 'const VERSION = ' text"
    exit 3
}
