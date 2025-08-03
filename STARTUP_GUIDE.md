# Qwen Coder Tools Plugin - Auto Startup

This folder contains scripts to automatically start the plugin in development mode as a workaround for the LM Studio plugin installation issue.

## Problem
LM Studio plugins can only be permanently installed via `lms push` to the Hub (requires authentication) or run temporarily with `lms dev`. There's no documented way to install plugins locally without Hub access.

## Workaround Solution
These startup scripts automatically run `lms dev` when LM Studio is detected, providing a seamless plugin experience.

## Usage

### Option 1: Batch File (Windows CMD)
Double-click `start-plugin.bat` or run:
```cmd
start-plugin.bat
```

### Option 2: PowerShell Script
Right-click `start-plugin.ps1` → "Run with PowerShell" or run:
```powershell
.\start-plugin.ps1
```

### Option 3: Manual Command
Open terminal in this directory and run:
```cmd
lms dev
```

## Auto-Startup Setup

### Windows Startup Folder
1. Press `Win + R`, type `shell:startup`, press Enter
2. Copy `start-plugin.bat` to the startup folder
3. The plugin will auto-start when Windows boots

### Task Scheduler (Advanced)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "When I log on"
4. Set action: Start program `start-plugin.bat`
5. Configure to only run when LM Studio is running

### Desktop Shortcut
1. Right-click desktop → New → Shortcut
2. Browse to `start-plugin.bat`
3. Name it "Start Qwen Plugin"
4. Double-click to start plugin anytime

## Features
- ✅ Automatically detects if LM Studio is running
- ✅ Validates plugin directory and files
- ✅ Provides clear status messages
- ✅ Handles errors gracefully
- ✅ Works from any location
- ✅ Both CMD and PowerShell versions

## Notes
- Keep the script window open while using the plugin
- Press Ctrl+C to stop the plugin
- The plugin only works while the development server is running
- This is a temporary workaround until the installation issue is resolved

## Plugin Tools Available
When running, the plugin provides these tools:
1. `create_file` - Create files with content
2. `read_file` - Read existing files
3. `list_files` - Explore directories
4. `execute_code` - Run Python/JavaScript
5. `git_operation` - Version control
6. `package_manager` - Install dependencies
7. `create_project_structure` - Scaffold projects
8. `web_search` - Research with Brave API
9. `autonomous_agent` - Agent mode (when enabled)

Enable "Agent Mode" in LM Studio plugin settings for autonomous behavior.
