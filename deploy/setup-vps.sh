#!/usr/bin/env bash
# =============================================================================
# CoreSound — VPS Setup Script (Debian/Ubuntu on IONOS)
#
# This script installs all system dependencies required to run:
#   - Node.js (backend + built frontend)
#   - Blender headless (for Python/bpy rendering)
#   - Python 3 + pip + venv (for Librosa analysis + Blender scripting)
#
# Usage:
#   chmod +x deploy/setup-vps.sh
#   sudo ./deploy/setup-vps.sh
# =============================================================================

set -euo pipefail

echo "===== CoreSound VPS Setup ====="

# ---------------------------------------------------------------------------
# 1. System updates
# ---------------------------------------------------------------------------
apt-get update && apt-get upgrade -y

# ---------------------------------------------------------------------------
# 2. Install Node.js 20 LTS
# ---------------------------------------------------------------------------
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# ---------------------------------------------------------------------------
# 3. Install Python 3 + pip + venv
# ---------------------------------------------------------------------------
apt-get install -y python3 python3-pip python3-venv python3-dev

# ---------------------------------------------------------------------------
# 4. Install Blender (headless)
#
# Blender needs certain X11/Mesa libraries even in --background mode.
# We install the virtual framebuffer (xvfb) so Blender can initialize
# its OpenGL context without a physical display.
# ---------------------------------------------------------------------------
apt-get install -y \
    blender \
    xvfb \
    libxi6 \
    libxrender1 \
    libxkbcommon0 \
    libgl1-mesa-glx \
    libegl1-mesa \
    libgles2-mesa

echo "Blender version: $(blender --version | head -1)"

# ---------------------------------------------------------------------------
# 5. Install audio processing system dependencies (for librosa/soundfile)
# ---------------------------------------------------------------------------
apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev

# ---------------------------------------------------------------------------
# 6. Create application directory structure
# ---------------------------------------------------------------------------
APP_DIR="/opt/coresound"
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/server/uploads"
mkdir -p "$APP_DIR/server/storage/stl"
mkdir -p "$APP_DIR/server/storage/obj"
mkdir -p "$APP_DIR/server/storage/renders"

# ---------------------------------------------------------------------------
# 7. Set up Python virtual environment
# ---------------------------------------------------------------------------
VENV_DIR="$APP_DIR/python-service/venv"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install librosa numpy soundfile
deactivate

echo ""
echo "===== Setup Complete ====="
echo ""
echo "Next steps:"
echo "  1. Copy your project files to $APP_DIR"
echo "  2. cd $APP_DIR && npm run setup"
echo "  3. cd client && npm run build"
echo "  4. Set up the systemd service: sudo cp deploy/coresound.service /etc/systemd/system/"
echo "  5. sudo systemctl enable --now coresound"
echo ""
