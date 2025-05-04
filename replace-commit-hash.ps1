# Replace the COMMIT_HASH value in App.js with current git commit hash before build
$commitHash = git rev-parse HEAD
$appJsPath = Join-Path $PSScriptRoot 'src/App.js'
(Get-Content $appJsPath -Raw) -replace 'const COMMIT_HASH = ".*";', "const COMMIT_HASH = \"$commitHash\";" | Set-Content $appJsPath
Write-Host "Replaced COMMIT_HASH with $commitHash in App.js"
