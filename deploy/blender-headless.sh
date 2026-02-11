#!/usr/bin/env bash
# =============================================================================
# Wrapper script to run Blender with a virtual framebuffer (xvfb).
# Use this instead of calling blender directly on a headless VPS.
#
# Usage:
#   ./deploy/blender-headless.sh --background --python script.py -- --arg1 val1
# =============================================================================

set -euo pipefail

# xvfb-run provides a virtual X11 display so Blender can initialize OpenGL
exec xvfb-run -a --server-args="-screen 0 1920x1080x24" \
    blender "$@"
