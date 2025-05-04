# Generate .env file with current commit hash for React build
$commitHash = git rev-parse HEAD
Set-Content -Path .env -Value "REACT_APP_COMMIT_HASH=$commitHash"
Write-Host ".env file generated with REACT_APP_COMMIT_HASH=$commitHash"
