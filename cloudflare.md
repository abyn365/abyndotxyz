# Deployment Guide: Hosting via Cloudflare Tunnel

This guide explains how to expose and host this Next.js music dashboard application securely on the public internet using a **Cloudflare Tunnel (`cloudflared`)**.

A Cloudflare Tunnel connects your local server or VPS directly to Cloudflare's network without exposing any public inbound ports, setting up complex firewalls, or purchasing public static IP addresses.

---

## Prerequisites

1. A **Cloudflare Account** with a domain name pointing to Cloudflare nameservers.
2. The application built and tested locally (using Node.js or Bun).
3. System privileges to install services on your host machine/VPS.

---

## Step 1: Prepare and Build the App

Configure your environment variables and build the Next.js production bundle.

1. Create a production `.env.local` file in the root of the repository:
   ```env
   # Last.fm API credentials
   LASTFM_API_KEY=your_lastfm_key
   LASTFM_USERNAME=your_lastfm_username

   # Spotify API credentials (for listening along & live-sync features)
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

   # Discord ID (for presence sync)
   NEXT_PUBLIC_DISCORD_ID=your_discord_snowflake_id
   ```

2. Compile and build the Next.js app:
   * **Using Bun:**
     ```bash
     bun run build
     ```
   * **Using NPM:**
     ```bash
     npm run build
     ```

3. Verify the production build runs locally:
   ```bash
   bun run start  # launches on http://localhost:3000
   ```

---

## Step 2: Install Cloudflare Tunnel (`cloudflared`)

Install the lightweight Cloudflare daemon (`cloudflared`) on the hosting server.

### On Debian/Ubuntu Linux:
```bash
# Add Cloudflare's GPG key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

# Add Cloudflare repository
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bullseye main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
sudo apt-get update && sudo apt-get install cloudflared
```

### On macOS (via Homebrew):
```bash
brew install cloudflare/cloudflare/cloudflared
```

### On Windows (via PowerShell/Chocolatey):
```powershell
choco install cloudflared
# Or download the EXE directly from: https://github.com/cloudflare/cloudflared/releases
```

---

## Step 3: Authenticate the Tunnel Daemon

Run the login command on the hosting server. This opens a browser window where you authorize the tunnel to manage your Cloudflare DNS zone.

```bash
cloudflared tunnel login
```

Once authorized, a credentials certificate (`cert.pem`) will be saved automatically to your user directory (e.g., `~/.cloudflared/cert.pem` on Linux or `%USERPROFILE%\.cloudflared\cert.pem` on Windows).

---

## Step 4: Create the Tunnel

Create the tunnel instance. Replace `music-dashboard-tunnel` with your desired name:

```bash
cloudflared tunnel create music-dashboard-tunnel
```

This returns a unique **Tunnel ID** and saves a credentials JSON file in the `.cloudflared` folder (e.g., `~/.cloudflared/<tunnel-id>.json`). Keep this JSON file secure.

---

## Step 5: Configure the Tunnel

Create a configuration file named `config.yml` in the `.cloudflared` directory (e.g., `~/.cloudflared/config.yml`):

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/username/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Map your domain (or subdomain) to the local Next.js port
  - hostname: music.yourdomain.com
    service: http://localhost:3000
  # Catch-all rule returning a 404 for unmatched traffic
  - service: http_status:404
```
> [!IMPORTANT]
> Replace `/home/username/` with the absolute path to your home directory containing the credentials JSON file. On Windows, use a path like `C:\Users\username\.cloudflared\<YOUR-TUNNEL-ID>.json`.

---

## Step 6: Configure DNS Routing

Link your domain subdomain to the tunnel. This adds a special CNAME record in your Cloudflare DNS settings:

```bash
cloudflared tunnel route dns music-dashboard-tunnel music.yourdomain.com
```

---

## Step 7: Test the Tunnel

You can now test running the tunnel in the foreground:

```bash
cloudflared tunnel run music-dashboard-tunnel
```

Verify that you can navigate to `https://music.yourdomain.com` in your browser. The connection will be secured using Cloudflare's SSL edge certificate.

---

## Step 8: Run as a Daemon System Service

To ensure the tunnel runs in the background and starts automatically on system boot:

### On Linux (systemd):
```bash
# Install the service configuration
sudo cloudflared --config /home/username/.cloudflared/config.yml service install

# Start and enable the systemd service
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

### On Windows (PowerShell as Admin):
```powershell
cloudflared.exe --config C:\Users\username\.cloudflared\config.yml service install
Start-Service -Name "cloudflared"
```

---

## Additional Production Tuning

### 1. PM2 Process Manager (for Next.js)
To keep the Next.js process running in the background and auto-restart it if it crashes, install `pm2`:
```bash
sudo npm install -g pm2
pm2 start npm --name "music-app" -- start
pm2 save
pm2 startup
```

### 2. Stream Buffer Optimization
Since our `/api/stream` route proxies large YouTube streams, make sure you configure your Cloudflare Cache Rules to **bypass cache** or disable buffering for the `/api/stream` endpoint to prevent latency or memory buffers buildup on the Cloudflare CDN edge.
