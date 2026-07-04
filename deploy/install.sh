#!/usr/bin/env bash

set -euo pipefail

# Configuration
DEPLOY_DIR="/var/www/abyndotxyz"
BIN_DIR="$DEPLOY_DIR/bin"
YT_DLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"

echo "=== Initializing Portofolio VPS Setup ==="

# 1. Create directory structure
echo "Creating deployment directory structure..."
sudo mkdir -p "$DEPLOY_DIR"
sudo mkdir -p "$BIN_DIR"
sudo chown -R "$USER:$USER" "$DEPLOY_DIR"

# 2. Download and configure yt-dlp
echo "Downloading the latest yt-dlp binary..."
curl -L "$YT_DLP_URL" -o "$BIN_DIR/yt-dlp"
chmod +x "$BIN_DIR/yt-dlp"
echo "yt-dlp version: $($BIN_DIR/yt-dlp --version)"

# 3. Copy deployment assets from repo
# If running inside a git clone, copy them. If run as curl script, download them.
if [ -f "deploy/start.sh" ]; then
  echo "Copying deployment assets from local repository..."
  cp deploy/start.sh "$DEPLOY_DIR/start.sh"
  cp deploy/update.sh "$DEPLOY_DIR/update.sh"
  cp deploy/systemd.service "$DEPLOY_DIR/systemd.service"
  cp deploy/ecosystem.config.js "$DEPLOY_DIR/ecosystem.config.js"
  cp deploy/.env.example "$DEPLOY_DIR/.env.example"
else
  echo "Downloading deployment assets from main repository..."
  RAW_BASE="https://raw.githubusercontent.com/abyn365/abyndotxyz/main/deploy"
  curl -fsSL "$RAW_BASE/start.sh" -o "$DEPLOY_DIR/start.sh"
  curl -fsSL "$RAW_BASE/update.sh" -o "$DEPLOY_DIR/update.sh"
  curl -fsSL "$RAW_BASE/systemd.service" -o "$DEPLOY_DIR/systemd.service"
  curl -fsSL "$RAW_BASE/ecosystem.config.js" -o "$DEPLOY_DIR/ecosystem.config.js"
  curl -fsSL "$RAW_BASE/.env.example" -o "$DEPLOY_DIR/.env.example"
fi

chmod +x "$DEPLOY_DIR/start.sh"
chmod +x "$DEPLOY_DIR/update.sh"

# 4. Initialize .env file if not present
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  echo "Initializing new .env file from .env.example..."
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  echo ">>> Action Required: Open $DEPLOY_DIR/.env and set your Spotify, Last.fm, and Upstash Redis secrets."
else
  echo ".env file already exists, skipping initialization."
fi

echo "=== Setup Completed Successfully ==="
echo "Deployment folder created at: $DEPLOY_DIR"
echo "Deploy documentation is available in $DEPLOY_DIR/README.md or the deploy/ folder."
