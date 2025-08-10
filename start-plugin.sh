#!/bin/bash
# LM Studio Plugin Auto-Dev Script (Linux/macOS)
# This script automatically starts the qwen-coder-tools plugin in development mode
# with auto-detection and setup for LM Studio.

echo "Starting Qwen Coder Tools Plugin Auto-Dev..."

# Get current script directory and user home
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_HOME="$HOME"
PLUGIN_DIR="$USER_HOME/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools"

# Check if LM Studio is running (multiple possible process names)
if pgrep -x "lmstudio" > /dev/null || pgrep -x "LM Studio" > /dev/null || pgrep -x "LMStudio" > /dev/null || pgrep -i "lm.studio" > /dev/null; then
    echo "LM Studio is running. Setting up plugin development environment..."
else
    echo "LM Studio is not running. Please start LM Studio first."
    echo "Make sure LM Studio has been run at least once to create the extensions directory."
    read -p "Press Enter to exit"
    exit 1
fi

# Check if LM Studio extensions directory exists
if [ ! -d "$USER_HOME/.lmstudio" ]; then
    echo "Error: LM Studio directory not found. Please run LM Studio at least once."
    echo "Expected location: $USER_HOME/.lmstudio"
    read -p "Press Enter to exit"
    exit 1
fi

# Create plugin directory structure if it doesn't exist
echo "Creating plugin directory structure..."
mkdir -p "$USER_HOME/.lmstudio/extensions/plugins/lmstudio"
mkdir -p "$PLUGIN_DIR"

# Check if we're running from the plugin source directory
if [ -f "$SCRIPT_DIR/manifest.json" ]; then
    echo "Found plugin files in source directory. Copying to plugin directory..."
    cp "$SCRIPT_DIR/manifest.json" "$PLUGIN_DIR/"
    cp "$SCRIPT_DIR/package.json" "$PLUGIN_DIR/"
    if [ -d "$SCRIPT_DIR/src" ]; then
        cp -r "$SCRIPT_DIR/src" "$PLUGIN_DIR/"
    fi
    # Copy compiled JavaScript files if they exist
    for file in index.js toolsProvider.js agentProvider.js config.js; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            cp "$SCRIPT_DIR/$file" "$PLUGIN_DIR/"
        fi
    done
    echo "Plugin files copied successfully."
else
    echo "Warning: Running from non-plugin directory. Plugin files may need to be manually copied."
fi

# Change to plugin directory
cd "$PLUGIN_DIR" || exit 1

# Validate required files
if [ ! -f "manifest.json" ]; then
    echo "Error: manifest.json not found in plugin directory."
    echo ""
    echo "Setup Instructions:"
    echo "1. Make sure you have downloaded/cloned the qwen-code-tools repository"
    echo "2. Run this script from the repository directory, or"
    echo "3. Manually copy these files to $PLUGIN_DIR:"
    echo "   - manifest.json"
    echo "   - package.json"
    echo "   - src/ directory"
    echo "   - All .js files (index.js, toolsProvider.js, etc.)"
    echo ""
    read -p "Press Enter to exit"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please copy all plugin files to the plugin directory."
    read -p "Press Enter to exit"
    exit 1
fi

echo ""
echo "==============================================="
echo "  Qwen Coder Tools Plugin - Auto Dev Mode"
echo "==============================================="
echo "Plugin Directory: $PLUGIN_DIR"
echo ""
echo "Starting development server..."
echo "Note: Keep this terminal open while using the plugin"
echo "Press Ctrl+C to stop the plugin"
echo ""

# Start the development server
lms dev

echo ""
echo "Development server stopped."
read -p "Press Enter to exit"
