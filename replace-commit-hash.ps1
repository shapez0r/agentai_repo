# Replace __COMMIT_HASH__ in App.js with current git commit hash before build
$commitHash = git rev-parse HEAD
$appJsPath = Join-Path $PSScriptRoot 'src/App.js'
$updatedContent = (Get-Content $appJsPath -Raw) -replace '\{__COMMIT_HASH__\}', "$commitHash"
$updatedContent | Set-Content $appJsPath
Write-Host "Replaced __COMMIT_HASH__ with $commitHash in App.js"
