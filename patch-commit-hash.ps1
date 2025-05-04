# Correct replacement logic for __COMMIT_HASH__ in built main.js
$commitHash = git rev-parse HEAD
# Find main.*.js in build/static/js
$mainJs = Get-ChildItem -Path "$PSScriptRoot\build\static\js" -Filter "main*.js" | Select-Object -First 1
if ($mainJs) {
    (Get-Content $mainJs.FullName -Raw) -replace '\{__COMMIT_HASH__\}', $commitHash | Set-Content $mainJs.FullName
    Write-Host "Replaced __COMMIT_HASH__ with $commitHash in $($mainJs.Name)"
} else {
    Write-Host "main.*.js not found in build/static/js. Run build first."
    exit 1
}
