# Production VPS Deployment Guide

This directory contains the necessary configuration files and scripts to deploy and maintain this project on an Ubuntu/Debian VPS using the **Bun** runtime.

## Deployment Overview

The project is built using Next.js standalone outputs. The build process happens entirely inside GitHub Actions (CI/CD), which produces a production-ready, highly optimized `.zip` archive containing only the code and dependencies actually used at runtime.

This avoids compilation overhead, CPU spikes, and memory issues on the VPS during builds. The VPS only has to download the pre-compiled artifact, unzip it, and start/restart the server.

---

## Initial Setup on a Fresh VPS

### 1. Install System Dependencies
Connect to your VPS via SSH and install the required tools. `ffmpeg` and `python3` are required by `yt-dlp` to extract and stream high-quality audio formats.
```bash
sudo apt update
sudo apt install -y curl unzip python3 ffmpeg
```

### 2. Install the Bun Runtime
```bash
curl -fsSL https://bun.sh/install | bash
# Reload your shell configurations to make 'bun' available in your PATH
source ~/.bashrc
```

### 3. Run the Installation Script
Download and execute the installation script to set up directories and fetch `yt-dlp`:
```bash
curl -fsSL https://raw.githubusercontent.com/abyn365/abyndotxyz/main/deploy/install.sh | bash
```
This script will:
- Initialize the `/var/www/abyndotxyz` deployment directory.
- Download the latest standalone `yt-dlp` executable.
- Install the startup scripts and environment template.

### 4. Configure Environment Variables
Open the `.env` file and fill in your private API tokens (Spotify, Last.fm, Redis/KV, etc.):
```bash
nano /var/www/abyndotxyz/.env
```

---

## Starting and Managing the Server

You have two choices for managing the production process:

### Option A: Systemd Daemon (Recommended)
Copy the pre-made service definition and start it. Systemd manages automatic restarts on crashes, boot cycles, and logs:
```bash
sudo cp /var/www/abyndotxyz/systemd.service /etc/etc/systemd/system/abyndotxyz.service
sudo systemctl daemon-reload
sudo systemctl enable abyndotxyz
sudo systemctl start abyndotxyz

# View logs
sudo journalctl -u abyndotxyz -f -n 100
```

### Option B: PM2 Process Manager
If you prefer PM2:
```bash
# Install PM2 globally
bun install -g pm2

# Start the application using the ecosystem config
pm2 start /var/www/abyndotxyz/ecosystem.config.js

# Save process list to restart on VPS reboot
pm2 save
pm2 startup
```

---

## Graceful Updates (CI/CD Deployments)

When a build finishes successfully on GitHub Actions, it generates a release artifact (a zip file). To deploy this update onto the VPS:
```bash
/var/www/abyndotxyz/update.sh -u "<URL_TO_RELEASE_ZIP>"
```
This script downloads the zip, extracts it to a temporary staging folder, replaces the active production folder atomically, and restarts the systemd service (or PM2 process) without downtime.
