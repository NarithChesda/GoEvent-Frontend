<#
.SYNOPSIS
  Installs the Playwright browser binaries this repo needs, without using
  `npx playwright install`.

.DESCRIPTION
  `npx playwright install` reliably HANGS on this project's Windows setup: it
  finishes the download, then deadlocks before extracting, leaving a partial
  browser directory (a 0-byte chrome.dll) and a stale __dirlock. Playwright
  then sees a directory that exists but has no INSTALLATION_COMPLETE marker,
  so every later run demands a reinstall - which hangs again.

  This script does what `playwright install` does, but with a plain download
  and a .NET zip extraction (~3s instead of hanging):
    1. reads the required revisions from playwright-core/browsers.json
    2. skips anything already marked INSTALLATION_COMPLETE
    3. downloads the win64 zip, extracts it, writes the marker

  Idempotent - safe to re-run. Use -Force to reinstall regardless.

.EXAMPLE
  npm run test:e2e:install
  powershell -ExecutionPolicy Bypass -File scripts/install-playwright-browsers.ps1 -Force
#>
[CmdletBinding()]
param(
  # Reinstall even if the browser is already marked complete.
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # Write-Progress makes downloads ~10x slower

$repoRoot = Split-Path -Parent $PSScriptRoot
$browsersJson = Join-Path $repoRoot 'node_modules\playwright-core\browsers.json'

if (-not (Test-Path $browsersJson)) {
  throw "Cannot find $browsersJson - run 'npm install' first."
}

$installRoot = if ($env:PLAYWRIGHT_BROWSERS_PATH) {
  $env:PLAYWRIGHT_BROWSERS_PATH
} else {
  Join-Path $env:LOCALAPPDATA 'ms-playwright'
}

# Browser name -> (install dir prefix, zip path segment). Mirrors Playwright's
# own naming, which is NOT a plain slug of the browser name.
$targets = @(
  @{ Name = 'chromium';                 Dir = 'chromium';                 Url = 'chromium/{rev}/chromium-win64.zip' }
  @{ Name = 'chromium-headless-shell';  Dir = 'chromium_headless_shell';  Url = 'chromium/{rev}/chromium-headless-shell-win64.zip' }
  @{ Name = 'ffmpeg';                   Dir = 'ffmpeg';                   Url = 'ffmpeg/{rev}/ffmpeg-win64.zip' }
  @{ Name = 'winldd';                   Dir = 'winldd';                   Url = 'winldd/{rev}/winldd-win64.zip' }
)

$manifest = Get-Content $browsersJson -Raw | ConvertFrom-Json
$cdn = 'https://cdn.playwright.dev/dbazure/download/playwright/builds'

Add-Type -AssemblyName System.IO.Compression.FileSystem
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null

# A stale lock from a previously killed install blocks nothing here, but leaving
# it around confuses Playwright's own tooling later.
Remove-Item (Join-Path $installRoot '__dirlock') -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Playwright browsers -> $installRoot`n"

foreach ($t in $targets) {
  $entry = $manifest.browsers | Where-Object { $_.name -eq $t.Name }
  if (-not $entry) {
    Write-Host "  ! $($t.Name): not in browsers.json, skipping" -ForegroundColor Yellow
    continue
  }

  $rev = $entry.revision
  $dir = Join-Path $installRoot "$($t.Dir)-$rev"
  $marker = Join-Path $dir 'INSTALLATION_COMPLETE'

  if ((Test-Path $marker) -and -not $Force) {
    Write-Host "  = $($t.Name) $rev already installed" -ForegroundColor DarkGray
    continue
  }

  $url = "$cdn/$($t.Url -replace '\{rev\}', $rev)"
  $tmp = Join-Path ([System.IO.Path]::GetTempPath()) "pw-$($t.Dir)-$rev.zip"

  try {
    Write-Host "  + $($t.Name) $rev" -NoNewline
    Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing -TimeoutSec 600
    Write-Host " downloaded $([math]::Round((Get-Item $tmp).Length / 1MB, 1))MB" -NoNewline

    # Remove any partial directory from an earlier hung install before extracting.
    Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    [System.IO.Compression.ZipFile]::ExtractToDirectory($tmp, $dir)

    New-Item -ItemType File -Path $marker -Force | Out-Null
    Write-Host " -> extracted" -ForegroundColor Green
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "`nVerifying..."
$chromeExe = Join-Path $installRoot "chromium-$(($manifest.browsers | Where-Object { $_.name -eq 'chromium' }).revision)\chrome-win\chrome.exe"
if (Test-Path $chromeExe) {
  Write-Host "  chrome.exe present" -ForegroundColor Green
} else {
  throw "chrome.exe missing at $chromeExe - installation did not succeed."
}
