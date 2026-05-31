#!/bin/sh
set -e

echo "⚡ Installing skillpack..."

# Check for required tools
check_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "⚠️  $1 not found. Some skills may need it."
    echo "   $2"
  fi
}

check_tool pdftotext "Install: sudo apt install poppler-utils"
check_tool jq "Install: sudo apt install jq"
check_tool convert "Install: sudo apt install imagemagick"

# Try npm install first
if command -v npm >/dev/null 2>&1; then
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
chmod +x "$INSTALL_DIR/bin/skillpack"
ln -sf "$INSTALL_DIR/bin/skillpack" "$HOME/.local/bin/skillpack"

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
