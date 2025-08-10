# Qwen Coder Tools Plugin - Auto Startup & Installation

This guide covers the enhanced auto-setup and installation process for the LM Studio plugin.

## 🚀 New Auto-Setup Features

The startup scripts now automatically handle installation and setup, eliminating the "manifest.json not found" error.

### What's Fixed
- ✅ **Auto-detects user directories** (no more hardcoded paths)
- ✅ **Creates plugin directory structure** automatically
- ✅ **Copies plugin files** from source to destination
- ✅ **Validates setup** before starting
- ✅ **Cross-platform support** (Windows, macOS, Linux)
- ✅ **Enhanced error messages** with clear guidance

## 📋 Quick Start

### Step 1: Download Repository
```bash
git clone https://github.com/RiaanDeWinnaar/qwen-code-tools.git
cd qwen-code-tools
```

### Step 2: Start LM Studio
Run LM Studio at least once to create the extensions directory structure.

### Step 3: Run Auto-Setup Script
Choose your platform:

#### Windows Command Prompt
```cmd
.\start-plugin.bat
```

#### Windows PowerShell
```powershell
.\start-plugin.ps1
```

#### Linux/macOS Terminal
```bash
./start-plugin.sh
```

### What Happens Automatically
1. **LM Studio Detection**: Checks if LM Studio is running
2. **Directory Creation**: Creates `~/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools/`
3. **File Copying**: Copies `manifest.json`, `package.json`, `src/`, and all `.js` files
4. **Validation**: Ensures all required files are present
5. **Server Start**: Launches `lms dev` development server

## 🔧 Manual Installation (Fallback)

If auto-setup fails, follow these manual steps:

### Windows
```cmd
# Create directory
mkdir "%USERPROFILE%\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools"

# Copy files manually to:
# C:\Users\[YourUsername]\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools\
```

### Linux/macOS
```bash
# Create directory
mkdir -p ~/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools

# Copy files manually to:
# ~/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools/
```

### Required Files to Copy
- `manifest.json`
- `package.json`
- `src/` directory (complete)
- `index.js`
- `toolsProvider.js`
- `agentProvider.js`
- `config.js`

## 🔍 Troubleshooting

### "manifest.json not found" Error
**Cause**: Plugin directory structure doesn't exist or files weren't copied.

**Solutions**:
1. **Use Auto-Setup**: Run the startup script from the repository directory
2. **Check LM Studio**: Ensure LM Studio has been run at least once
3. **Verify Path**: Check that this directory exists:
   - Windows: `%USERPROFILE%\.lmstudio\extensions\plugins\lmstudio\qwen-coder-tools\`
   - Linux/macOS: `~/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools/`
4. **Manual Copy**: Follow manual installation steps above

### "LM Studio not running" Error
**Solutions**:
1. Start LM Studio application
2. Wait for complete startup (may take 30-60 seconds)
3. Try running the script again

### "Plugin directory not found" Error
**Solutions**:
1. Run LM Studio at least once to create base directories
2. Check permissions on home directory
3. Try manual directory creation commands above

### Permission Issues

#### Windows
- Run Command Prompt as Administrator
- Check that you have write access to `%USERPROFILE%` directory

#### Linux/macOS
- Check directory permissions: `ls -la ~/.lmstudio`
- Fix permissions if needed: `chmod 755 ~/.lmstudio`
- Ensure home directory is writable

### Script Won't Execute

#### Windows
- **Batch File**: Right-click `start-plugin.bat` → "Run as administrator"
- **PowerShell**: May need to allow script execution:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

#### Linux/macOS
- Make script executable: `chmod +x start-plugin.sh`
- Run with: `./start-plugin.sh`

## 🎯 Auto-Startup Setup

### Windows Startup Folder
1. Press `Win + R`, type `shell:startup`, press Enter
2. Copy `start-plugin.bat` to the startup folder
3. Plugin will auto-start when Windows boots

### Task Scheduler (Advanced Windows)
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

## 📁 Directory Structure

After successful setup, you should have:

```
~/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools/
├── manifest.json          # Plugin metadata
├── package.json            # Dependencies
├── src/                    # Source TypeScript files
│   ├── index.ts
│   ├── toolsProvider.ts
│   ├── agentProvider.ts
│   └── config.ts
├── index.js               # Compiled JavaScript
├── toolsProvider.js       # Main tools implementation
├── agentProvider.js       # Autonomous agent functionality
└── config.js              # Configuration schemas
```

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "manifest.json not found" | Missing plugin directory structure | Run auto-setup script from repo directory |
| "LM Studio not running" | LM Studio isn't started | Start LM Studio application first |
| "Permission denied" | Insufficient file permissions | Run as administrator (Windows) or check chmod (Unix) |
| "Plugin directory not found" | LM Studio never run | Start LM Studio once to create base directories |
| "Files not copied" | Running from wrong directory | Navigate to repo directory before running script |

## 🧪 Validation Steps

After setup, verify everything works:

1. **Check Files**: Ensure all files exist in plugin directory
2. **Test Script**: Run startup script - should show "Plugin files copied successfully"
3. **LM Studio**: Open LM Studio and check if plugin appears in extensions
4. **Development Server**: Should see "Starting development server..." message

## 📞 Getting Help

If you're still having issues:

1. **Check GitHub Issues**: [Report bugs here](https://github.com/RiaanDeWinnaar/qwen-code-tools/issues)
2. **Review Logs**: Check terminal output for specific error messages
3. **Community**: Join discussions for community support
4. **Documentation**: Review [LM Studio Plugin Docs](https://lmstudio.ai/docs/typescript/plugins)

---

**Note**: This is a temporary workaround until LM Studio provides native local plugin installation. The auto-setup process makes installation seamless while maintaining the development server approach.
