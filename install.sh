#!/bin/sh
set -e

echo "⚡ Installing skillpack..."

# Detect package manager
detect_pkg_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "apt"
  elif command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v yum >/dev/null 2>&1; then
    echo "yum"
  elif command -v pacman >/dev/null 2>&1; then
    echo "pacman"
  elif command -v brew >/dev/null 2>&1; then
    echo "brew"
  elif command -v apk >/dev/null 2>&1; then
    echo "apk"
  else
    echo "unknown"
  fi
}

# Install a package if not present
install_if_missing() {
  local cmd="$1"
  local pkg_deb="$2"
  local pkg_rpm="$3"
  local pkg_pacman="$4"
  local pkg_brew="$5"
  local pkg_apk="$6"

  if command -v "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $cmd already installed"
    return
  fi

  echo "  → Installing $cmd..."
  case "$PKG_MANAGER" in
    apt)
      sudo apt-get update -qq && sudo apt-get install -y -qq "$pkg_deb" >/dev/null 2>&1
      ;;
    dnf)
      sudo dnf install -y -q "$pkg_rpm" >/dev/null 2>&1
      ;;
    yum)
      sudo yum install -y -q "$pkg_rpm" >/dev/null 2>&1
      ;;
    pacman)
      sudo pacman -S --noconfirm "$pkg_pacman" >/dev/null 2>&1
      ;;
    brew)
      brew install "$pkg_brew" >/dev/null 2>&1
      ;;
    apk)
      sudo apk add --no-cache "$pkg_apk" >/dev/null 2>&1
      ;;
    *)
      echo "  ⚠ Could not auto-install $cmd. Install manually." >&2
      return 1
      ;;
  esac
  echo "  ✓ $cmd installed"
}

# Detect OS and package manager
OS="$(uname -s)"
PKG_MANAGER=$(detect_pkg_manager)

echo ""
echo "Detected: $OS with $PKG_MANAGER"
echo ""

# Install dependencies
echo "Installing required tools:"
install_if_missing pdftotext \
  "poppler-utils" "poppler-utils" "poppler" "poppler" "poppler-utils"

install_if_missing jq \
  "jq" "jq" "jq" "jq" "jq"

install_if_missing convert \
  "imagemagick" "ImageMagick" "imagemagick" "imagemagick" "imagemagick"

if ! command -v docx2txt >/dev/null 2>&1 && ! command -v pandoc >/dev/null 2>&1; then
  echo "  → Installing docx2txt..."
  _installed=false
  case "$PKG_MANAGER" in
    apt)    sudo apt-get install -y -qq docx2txt >/dev/null 2>&1 && _installed=true ;;
    dnf)    sudo dnf install -y -q docx2txt >/dev/null 2>&1 && _installed=true ;;
    yum)    sudo yum install -y -q docx2txt >/dev/null 2>&1 && _installed=true ;;
    brew)   brew install pandoc >/dev/null 2>&1 && _installed=true ;;
    pacman) sudo pacman -S --noconfirm pandoc >/dev/null 2>&1 && _installed=true ;;
    apk)    sudo apk add --no-cache pandoc >/dev/null 2>&1 && _installed=true ;;
    *)      echo "  ⚠ Could not auto-install docx2txt. Install manually." ;;
  esac
  if [ "$_installed" = "true" ]; then
    echo "  ✓ docx2txt/pandoc installed"
  else
    echo "  ⚠ Failed to install. Install manually." >&2
  fi
else
  echo "  ✓ docx2txt/pandoc already installed"
fi

echo ""

# Clone repo and symlink
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
