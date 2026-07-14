$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$zip = Join-Path $root "Youth-Camp-2026-Admin.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("yc-admin-zip-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stage | Out-Null
$excludeDirs = @("node_modules", ".next", ".git")
$excludeFiles = @(".env", "Youth-Camp-2026-Admin.zip", "dev.db", "dev.db-journal", "dev-server*.log")
robocopy $root $stage /E /XD $excludeDirs /XF $excludeFiles | Out-Null
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force
Remove-Item -LiteralPath $stage -Recurse -Force
Write-Host $zip
