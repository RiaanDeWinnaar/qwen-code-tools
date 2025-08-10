@echo off
REM LM Studio Plugin Auto-Dev Script
REM This script automatically starts the qwen-coder-tools plugin in development mode
REM with auto-detection and setup for LM Studio.

echo Starting Qwen Coder Tools Plugin Auto-Dev...

REM Get current script directory and user home
set SCRIPT_DIR=%~dp0
set USER_HOME=%USERPROFILE%
set PLUGIN_DIR=%USER_HOME%\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools

REM Check if LM Studio is running (multiple possible process names)
tasklist /FI "IMAGENAME eq LM Studio.exe" 2>NUL | find /I /N "LM Studio.exe">NUL
if "%ERRORLEVEL%"=="0" goto :lmstudio_running

tasklist /FI "IMAGENAME eq lmstudio.exe" 2>NUL | find /I /N "lmstudio.exe">NUL
if "%ERRORLEVEL%"=="0" goto :lmstudio_running

tasklist /FI "IMAGENAME eq LMStudio.exe" 2>NUL | find /I /N "LMStudio.exe">NUL
if "%ERRORLEVEL%"=="0" goto :lmstudio_running

echo LM Studio is not running. Please start LM Studio first.
echo Make sure LM Studio has been run at least once to create the extensions directory.
pause
exit /b 1

:lmstudio_running
echo LM Studio is running. Setting up plugin development environment...

REM Check if LM Studio extensions directory exists
if not exist "%USER_HOME%\.lmstudio" (
    echo Error: LM Studio directory not found. Please run LM Studio at least once.
    echo Expected location: %USER_HOME%\.lmstudio
    pause
    exit /b 1
)

REM Create plugin directory structure if it doesn't exist
echo Creating plugin directory structure...
if not exist "%USER_HOME%\.lmstudio\extensions" mkdir "%USER_HOME%\.lmstudio\extensions"
if not exist "%USER_HOME%\.lmstudio\extensions\plugins" mkdir "%USER_HOME%\.lmstudio\extensions\plugins"
if not exist "%USER_HOME%\.lmstudio\extensions\plugins\lmstudio" mkdir "%USER_HOME%\.lmstudio\extensions\plugins\lmstudio"
if not exist "%PLUGIN_DIR%" mkdir "%PLUGIN_DIR%"

REM Check if we're running from the plugin source directory
if exist "%SCRIPT_DIR%manifest.json" (
    echo Found plugin files in source directory. Copying to plugin directory...
    copy "%SCRIPT_DIR%manifest.json" "%PLUGIN_DIR%\" >NUL
    copy "%SCRIPT_DIR%package.json" "%PLUGIN_DIR%\" >NUL
    if exist "%SCRIPT_DIR%src" xcopy "%SCRIPT_DIR%src" "%PLUGIN_DIR%\src\" /E /I /Y >NUL
    if exist "%SCRIPT_DIR%index.js" copy "%SCRIPT_DIR%index.js" "%PLUGIN_DIR%\" >NUL
    if exist "%SCRIPT_DIR%toolsProvider.js" copy "%SCRIPT_DIR%toolsProvider.js" "%PLUGIN_DIR%\" >NUL
    if exist "%SCRIPT_DIR%agentProvider.js" copy "%SCRIPT_DIR%agentProvider.js" "%PLUGIN_DIR%\" >NUL
    if exist "%SCRIPT_DIR%config.js" copy "%SCRIPT_DIR%config.js" "%PLUGIN_DIR%\" >NUL
    echo Plugin files copied successfully.
) else (
    echo Warning: Running from non-plugin directory. Plugin files may need to be manually copied.
)

REM Change to plugin directory
cd /d "%PLUGIN_DIR%"

REM Validate required files
if not exist "manifest.json" (
    echo Error: manifest.json not found in plugin directory.
    echo.
    echo Setup Instructions:
    echo 1. Make sure you have downloaded/cloned the qwen-code-tools repository
    echo 2. Run this script from the repository directory, or
    echo 3. Manually copy these files to %PLUGIN_DIR%:
    echo    - manifest.json
    echo    - package.json
    echo    - src/ directory
    echo    - All .js files (index.js, toolsProvider.js, etc.)
    echo.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo Error: package.json not found. Please copy all plugin files to the plugin directory.
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
