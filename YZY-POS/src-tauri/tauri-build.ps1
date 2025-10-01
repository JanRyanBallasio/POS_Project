$frontendPath = Join-Path $PSScriptRoot "..\..\pos-frontend"
Write-Host "Building frontend in $frontendPath"
npm run build --prefix $frontendPath
