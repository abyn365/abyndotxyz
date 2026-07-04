#!/usr/bin/env bash

set -euo pipefail

DEPLOY_DIR="/var/www/abyndotxyz"
STAGE_DIR="$DEPLOY_DIR/stage_new"
BACKUP_DIR="$DEPLOY_DIR/backup_old"

show_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -u, --url <url>      URL to download the production build zip from"
  echo "  -f, --file <path>    Local path to the production build zip"
  echo "  -h, --help           Show this message"
}

ZIP_URL=""
ZIP_PATH=""

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--url)
      ZIP_URL="$2"
      shift 2
      ;;
    -f|--file)
      ZIP_PATH="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help
      exit 1
      ;;
  esac
done

if [ -z "$ZIP_URL" ] && [ -z "$ZIP_PATH" ]; then
  echo "Error: Must specify either --url or --file option." >&2
  show_help
  exit 1
fi

echo "=== Starting Graceful Production Update ==="
cd "$DEPLOY_DIR"

# 1. Fetch artifact if URL is provided
if [ -n "$ZIP_URL" ]; then
  echo "Downloading update package from URL..."
  ZIP_PATH="/tmp/abyndotxyz-build-latest.zip"
  curl -L "$ZIP_URL" -o "$ZIP_PATH"
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "Error: Build package zip not found at $ZIP_PATH" >&2
  exit 1
fi

# 2. Stage new files
echo "Preparing staging environment..."
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"
unzip -q "$ZIP_PATH" -d "$STAGE_DIR"

# Validate staging layout
if [ ! -f "$STAGE_DIR/server.js" ]; then
  echo "Error: Invalid build package. Staging directory does not contain standalone server.js entry point." >&2
  rm -rf "$STAGE_DIR"
  exit 1
fi

# 3. Create backup of current files
echo "Creating backup of current active deployment..."
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Move all current production server files (except env, bin, backup/staging folders themselves)
shopt -s extglob
for item in !(.env|bin|stage_new|backup_old); do
  if [ -e "$item" ]; then
    mv "$item" "$BACKUP_DIR/"
  fi
done

# 4. Atomically swap staging to production
echo "Activating new production build..."
mv "$STAGE_DIR"/* "$DEPLOY_DIR/"
rm -rf "$STAGE_DIR"

# 5. Clean up downloaded archive if retrieved via URL
if [ -n "$ZIP_URL" ]; then
  rm -f "$ZIP_PATH"
fi

# 6. Restart Server Process gracefully
echo "Restarting application service..."
if systemctl is-active --quiet abyndotxyz; then
  echo "Restarting systemd service (abyndotxyz)..."
  sudo systemctl restart abyndotxyz
elif command -v pm2 &>/dev/null && pm2 describe abyndotxyz &>/dev/null; then
  echo "Restarting PM2 process (abyndotxyz)..."
  pm2 restart abyndotxyz
else
  echo "Warning: No running systemd or PM2 daemon detected. Start manually using start.sh or systemctl/pm2."
fi

echo "=== Graceful Update Completed Successfully ==="
