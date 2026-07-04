#!/usr/bin/env bash

set -euo pipefail

# Configuration
DEPLOY_DIR="/var/www/abyndotxyz"
PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"

echo "Starting portfolio server..."
cd "$DEPLOY_DIR"

# 1. Verify environment configuration
if [ ! -f ".env" ]; then
  echo "Error: .env configuration file not found in $DEPLOY_DIR" >&2
  exit 1
fi

# Load variables to verify setup
export $(grep -v '^#' .env | xargs)

# 2. Check if build artifact is unpacked
if [ ! -f "server.js" ]; then
  echo "Error: Production standalone server (server.js) not found." >&2
  echo "Please deploy a release build using the update.sh script first." >&2
  exit 1
fi

# 3. Configure yt-dlp path fallback if not configured
export YT_DLP_PATH="${YT_DLP_PATH:-/var/www/abyndotxyz/bin/yt-dlp}"
echo "Using yt-dlp binary at: $YT_DLP_PATH"

# 4. Start Next.js standalone server using Bun
echo "Listening on $HOST:$PORT..."
exec bun server.js
