# LM Studio Plugin Auto-Dev Script (PowerShell)
# This script automatically starts the qwen-coder-tools plugin in development mode
# when LM Studio is running.

Write-Host "Starting Qwen Coder Tools Plugin Auto-Dev..." -ForegroundColor Green

# Set the plugin directory
$PluginDir = "c:\Users\riaan\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools"

# Check if LM Studio is running
$lmStudioProcess = Get-Process -Name "lmstudio" -ErrorAction SilentlyContinue

if ($lmStudioProcess) {
    Write-Host "LM Studio is running. Starting plugin development server..." -ForegroundColor Green
} else {
    Write-Host "LM Studio is not running. Please start LM Studio first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if plugin directory exists
if (-not (Test-Path $PluginDir)) {
    Write-Host "Error: Plugin directory not found: $PluginDir" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to plugin directory
Set-Location $PluginDir

# Check if manifest.json exists
if (-not (Test-Path "manifest.json")) {
    Write-Host "Error: Not a valid plugin directory. manifest.json not found." -ForegroundColor Red
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
