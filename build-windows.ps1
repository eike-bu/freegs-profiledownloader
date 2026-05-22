<#
.SYNOPSIS
  Build FreeGS Profile Downloader for Windows (x86_64 MSVC)
.DESCRIPTION
  Installs dependencies and builds the app. Run in PowerShell as Admin.
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "=== FreeGS Profile Downloader — Windows Build ===" -ForegroundColor Cyan
Write-Host ""

# ──────────────────────────────────────────────
# 1. Rust
# ──────────────────────────────────────────────
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "→ Installing Rust..." -ForegroundColor Yellow
    $env:RUSTUP_INIT_SKIP_PATH_CHECK = "yes"
    winget install --id Rustlang.Rustup --silent --accept-package-agreements
    rustup default stable-msvc
} else {
    Write-Host "✓ Rust found" -ForegroundColor Green
    rustup target add x86_64-pc-windows-msvc
}

# ──────────────────────────────────────────────
# 2. Node.js
# ──────────────────────────────────────────────
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "→ Installing Node.js..." -ForegroundColor Yellow
    winget install --id OpenJS.NodeJS --silent --accept-package-agreements
} else {
    Write-Host "✓ Node.js found" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 3. Visual C++ Build Tools (for MSVC)
# ──────────────────────────────────────────────
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$vsInstalled = & $vsWhere -latest -requires Microsoft.VisualStudio.Workload.VCTools -property installationPath 2>$null
if (-not $vsInstalled) {
    Write-Host "→ Installing Visual Studio Build Tools (VC++ workload)..." -ForegroundColor Yellow
    Write-Host "  This may take 10-20 minutes and ~5 GB." -ForegroundColor DarkYellow
    winget install --id Microsoft.VisualStudio.2022.BuildTools --override `
        "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
} else {
    Write-Host "✓ Visual C++ Build Tools found" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 4. Tauri CLI
# ──────────────────────────────────────────────
if (-not (Get-Command tauri -ErrorAction SilentlyContinue)) {
    Write-Host "→ Installing Tauri CLI..." -ForegroundColor Yellow
    cargo install tauri-cli --version "^2"
} else {
    Write-Host "✓ Tauri CLI found" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 5. WebView2 Runtime
# ──────────────────────────────────────────────
$regPath = "HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
if (-not (Get-ItemProperty -Path $regPath -Name "pv" -ErrorAction SilentlyContinue)) {
    Write-Host "→ Installing WebView2 Runtime..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://go.microsoft.com/fwlink/p/?LinkId=2124703" `
        -OutFile "$env:TEMP\MicrosoftEdgeWebview2Setup.exe"
    Start-Process "$env:TEMP\MicrosoftEdgeWebview2Setup.exe" -ArgumentList "/silent /install" -Wait
    Remove-Item "$env:TEMP\MicrosoftEdgeWebview2Setup.exe"
} else {
    Write-Host "✓ WebView2 Runtime found" -ForegroundColor Green
}

# ──────────────────────────────────────────────
# 6. Clone / Build
# ──────────────────────────────────────────────
$repoDir = "$env:USERPROFILE\freegs-app"
if (-not (Test-Path $repoDir)) {
    Write-Host "→ Cloning repository..." -ForegroundColor Yellow
    git clone http://10.8.0.1/freegs/freegs-app.git $repoDir
}

cd $repoDir
Write-Host "→ Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "→ Building FreeGS Profile Downloader..." -ForegroundColor Yellow
cargo tauri build

Write-Host ""
Write-Host "=== Build complete! ===" -ForegroundColor Green
Write-Host "Installer: $repoDir\src-tauri\target\release\bundle\nsis\FreeGS-*.exe" -ForegroundColor Cyan
Write-Host "Standalone: $repoDir\src-tauri\target\release\freegs-app.exe" -ForegroundColor Cyan