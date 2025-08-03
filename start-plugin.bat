@echo off
REM LM Studio Plugin Auto-Dev Script
REM This script automatically starts the qwen-coder-tools plugin in development mode
REM when LM Studio is running.

echo Starting Qwen Coder Tools Plugin Auto-Dev...

REM Set the plugin directory
set PLUGIN_DIR=c:\Users\riaan\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools

REM Check if LM Studio is running (by checking for lms process)
tasklist /FI "IMAGENAME eq lmstudio.exe" 2>NUL | find /I /N "lmstudio.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo LM Studio is running. Starting plugin development server...
) else (
    echo LM Studio is not running. Please start LM Studio first.
    pause
    exit /b 1
)

REM Change to plugin directory
if not exist "%PLUGIN_DIR%" (
    echo Error: Plugin directory not found: %PLUGIN_DIR%
    pause
    exit /b 1
)

cd /d "%PLUGIN_DIR%"

REM Check if manifest.json exists
if not exist "manifest.json" (
    echo Error: Not a valid plugin directory. manifest.json not found.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo  Qwen Coder Tools Plugin - Auto Dev Mode
echo ===============================================
echo Plugin Directory: %PLUGIN_DIR%
echo.
echo Starting development server...
echo Note: Keep this window open while using the plugin
echo Press Ctrl+C to stop the plugin
echo.

REM Start the development server
lms dev

echo.
echo Development server stopped.
pause
