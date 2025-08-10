# LM Studio Plugin Auto-Dev Script (PowerShell)
# This script automatically starts the qwen-coder-tools plugin in development mode
# with auto-detection and setup for LM Studio.

Write-Host "Starting Qwen Coder Tools Plugin Auto-Dev..." -ForegroundColor Green

# Get current script directory and user home
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UserHome = $env:USERPROFILE
$PluginDir = "$UserHome\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools"

# Check if LM Studio is running (multiple possible process names)
$lmStudioProcess = Get-Process -Name "LM Studio", "lmstudio", "LMStudio" -ErrorAction SilentlyContinue

if ($lmStudioProcess) {
    Write-Host "LM Studio is running. Setting up plugin development environment..." -ForegroundColor Green
} else {
    Write-Host "LM Studio is not running. Please start LM Studio first." -ForegroundColor Red
    Write-Host "Make sure LM Studio has been run at least once to create the extensions directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if LM Studio extensions directory exists
if (-not (Test-Path "$UserHome\.lmstudio")) {
    Write-Host "Error: LM Studio directory not found. Please run LM Studio at least once." -ForegroundColor Red
    Write-Host "Expected location: $UserHome\.lmstudio" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create plugin directory structure if it doesn't exist
Write-Host "Creating plugin directory structure..." -ForegroundColor Yellow
$null = New-Item -ItemType Directory -Force -Path "$UserHome\.lmstudio\extensions\plugins\lmstudio"
$null = New-Item -ItemType Directory -Force -Path $PluginDir

# Check if we're running from the plugin source directory
if (Test-Path "$ScriptDir\manifest.json") {
    Write-Host "Found plugin files in source directory. Copying to plugin directory..." -ForegroundColor Yellow
    Copy-Item "$ScriptDir\manifest.json" $PluginDir -Force
    Copy-Item "$ScriptDir\package.json" $PluginDir -Force
    if (Test-Path "$ScriptDir\src") {
        Copy-Item "$ScriptDir\src" $PluginDir -Recurse -Force
    }
    # Copy compiled JavaScript files if they exist
    $jsFiles = @("index.js", "toolsProvider.js", "agentProvider.js", "config.js")
    foreach ($file in $jsFiles) {
        if (Test-Path "$ScriptDir\$file") {
            Copy-Item "$ScriptDir\$file" $PluginDir -Force
        }
    }
    Write-Host "Plugin files copied successfully." -ForegroundColor Green
} else {
    Write-Host "Warning: Running from non-plugin directory. Plugin files may need to be manually copied." -ForegroundColor Yellow
}

# Change to plugin directory
Set-Location $PluginDir

# Validate required files
if (-not (Test-Path "manifest.json")) {
    Write-Host "Error: manifest.json not found in plugin directory." -ForegroundColor Red
    Write-Host ""
    Write-Host "Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have downloaded/cloned the qwen-code-tools repository"
    Write-Host "2. Run this script from the repository directory, or"
    Write-Host "3. Manually copy these files to $PluginDir:" -ForegroundColor Cyan
    Write-Host "   - manifest.json"
    Write-Host "   - package.json"
    Write-Host "   - src/ directory"
    Write-Host "   - All .js files (index.js, toolsProvider.js, etc.)"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please copy all plugin files to the plugin directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Qwen Coder Tools Plugin - Auto Dev Mode" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Plugin Directory: $PluginDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Note: Keep this window open while using the plugin" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the plugin" -ForegroundColor Yellow
Write-Host ""

# Start the development server
try {
    & lms dev
} catch {
    Write-Host "Error starting development server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Development server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
