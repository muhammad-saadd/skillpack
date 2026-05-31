#!/bin/bash
set -e

echo "⚡ Installing skillpack..."

# Check for Node.js >= 18
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js is required but not installed."
  echo "   Install Node.js >= 18 from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js >= 18 is required. Found v$(node -v)."
  echo "   Update Node.js from https://nodejs.org"
  exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Try npm install first
if command -v npm &> /dev/null; then
  echo "Installing via npm..."
  npm install -g skillpack
  echo ""
  echo "✅ skillpack installed successfully!"
  echo ""
  echo "Quickstart:"
  echo "  skillpack --help"
  echo "  skillpack doc-extract --help"
  echo "  skillpack data-wrangle --help"
  exit 0
fi

# Fallback: clone and symlink
echo "npm not found, installing from source..."
REPO_URL="https://github.com/muhammad-saadd/skillpack.git"
INSTALL_DIR="$HOME/.local/share/skillpack"

mkdir -p "$HOME/.local/bin"
git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/bin/skillpack.js"
ln -sf "$INSTALL_DIR/bin/skillpack.js" "$HOME/.local/bin/skillpack"

# Add to PATH if needed
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
  echo ""
  echo "⚠️  Add ~/.local/bin to your PATH:"
  echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
echo "✅ skillpack installed successfully!"
echo ""
echo "Quickstart:"
echo "  skillpack --help"
echo "  skillpack doc-extract --help"
echo "  skillpack data-wrangle --help"
