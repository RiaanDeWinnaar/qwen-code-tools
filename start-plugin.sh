#!/bin/bash
# LM Studio Plugin Auto-Dev Script (Linux/macOS)
# This script automatically starts the qwen-coder-tools plugin in development mode

echo "Starting Qwen Coder Tools Plugin Auto-Dev..."

# Set the plugin directory (adjust path for your system)
PLUGIN_DIR="$HOME/.lmstudio/extensions/plugins/lmstudio/qwen-coder-tools"

# Check if LM Studio is running
if pgrep -x "lmstudio" > /dev/null; then
    echo "LM Studio is running. Starting plugin development server..."
else
    echo "LM Studio is not running. Please start LM Studio first."
    read -p "Press Enter to exit"
    exit 1
fi

# Check if plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
    echo "Error: Plugin directory not found: $PLUGIN_DIR"
    read -p "Press Enter to exit"
    exit 1
fi

# Change to plugin directory
cd "$PLUGIN_DIR" || exit 1

# Check if manifest.json exists
if [ ! -f "manifest.json" ]; then
    echo "Error: Not a valid plugin directory. manifest.json not found."
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
