# abyn.xyz

> Personal portfolio site — built with Next.js, TypeScript, Bun, and Tailwind CSS.
> Live at **[abyn.xyz](https://abyn.xyz)**

---

## Overview

abyn.xyz is my personal portfolio and digital space. It features live Discord presence, music playback synced to Spotify via Last.fm, a blog, photo gallery, guestbook, and more.

**Tech stack highlights:**
- **Next.js** (Pages Router) · **TypeScript** · **Tailwind CSS** · **Framer Motion**
- **Bun** — for runtime, powers the local SQLite KV store via `bun:sqlite` and other tools supported natively
- **SQLite KV** — stores badges, activity history, and cached API responses persistently
- **Lanyard** — real-time Discord presence via WebSocket
- **Last.fm + Spotify** — music tracking and now-playing sync

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- Node.js ≥ 18 (for Next.js dev tooling)

### Setup

```bash
# Clone the repo
git clone https://github.com/abyn365/abyndotxyz.git
cd abyndotxyz

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env  # or deploy/.env.example .env
# Fill in your secrets (see Environment Variables below)

# Start the dev server
bun run dev
```

The app runs at `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default `3000`) |
| `HOST` | No | Bind host (default `127.0.0.1`) |
| `KV_DATABASE_PATH` | No | Path to `kv.sqlite` (default: project root) |
| `YT_DLP_PATH` | No | Path to `yt-dlp` binary (default: `/var/www/abyndotxyz/bin/yt-dlp`) |
| `YT_DLP_EXTRA_ARGS` | No | Extra args forwarded to yt-dlp |
| `GITHUB_TOKEN` | Yes | GitHub API token for project fetching |
| `LOCATION_SECRET` | Yes (for POST) | Shared secret to authorize location updates |
| `LASTFM_USERNAME` | Yes | Last.fm username |
| `LASTFM_API_KEY` | Yes | Last.fm API key |
| `LASTFM_API_SHARED_SECRET` | Yes | Last.fm shared secret |
| `SPOTIFY_CLIENT_ID` | Yes | Spotify application client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify application client secret |
| `SPOTIFY_REFRESH_TOKEN` | Yes | Spotify OAuth refresh token |
| `SPOTIFY_SP_DC` | No | Spotify internal cookie for Canvas resolution |
| `PAXSENIX_API_KEY` | No | Paxsenix API key (audio streaming fallback) |
| `UMAMI_BASE_URL` | No | Umami analytics base URL |
| `UMAMI_WEBSITE_ID` | No | Umami website ID |
| `UMAMI_AUTH_TOKEN` | No | Umami bearer token |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | No | Umami script URL (client-side) |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Umami website ID (client-side) |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS` | No | Google Analytics Measurement ID |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile site key |
| `ADMIN_USERNAME` | Yes | Admin panel username |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of admin password |
| `ADMIN_SESSION_SECRET` | Yes | Secret for signing admin sessions |
| `VISITOR_JWT_SECRET` | Yes | Secret for signing visitor JWT tokens |
| `S3_ENDPOINT` | No | S3-compatible object storage endpoint |
| `S3_ACCESS_KEY_ID` | No | S3 access key |
| `S3_SECRET_ACCESS_KEY` | No | S3 secret key |
| `S3_BUCKET_NAME` | No | S3 bucket for photo storage |
| `S3_PUBLIC_BASE_URL` | No | Public base URL for S3 assets |

---

## VPS Deployment

The site is designed to run on a Linux VPS using **Bun** to serve the Next.js standalone output. Builds happen in GitHub Actions and are pushed as a release zip — the VPS only extracts and restarts.

### First-time setup

Run the consolidated setup script on a fresh Ubuntu/Debian VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/abyn365/abyndotxyz/main/deploy/setup.sh | bash
```

This script:
1. Installs system dependencies (`curl`, `unzip`, `python3`, `ffmpeg`)
2. Installs Bun and symlinks it globally
3. Creates `/var/www/abyndotxyz/bin/` and downloads the latest `yt-dlp`
4. Downloads deploy scripts from this repo
5. Installs and enables the systemd service
6. Initializes `.env` from the template

After setup, fill in `/var/www/abyndotxyz/.env` with your secrets, then run:

```bash
/var/www/abyndotxyz/update.sh
```

### Deploying updates

When a GitHub Actions build finishes and creates a release zip, deploy it with:

```bash
# Use default (latest GitHub release)
/var/www/abyndotxyz/update.sh

# Or point at a specific URL
/var/www/abyndotxyz/update.sh --url "https://github.com/.../releases/download/.../abyndotxyz-build.zip"

# Or use a locally downloaded zip
/var/www/abyndotxyz/update.sh --file /tmp/build.zip
```

The script preserves `.env`, `kv.sqlite`, and `bin/` across every deploy, and prints a confirmation:
```
✓  .env            preserved
✓  kv.sqlite       preserved
✓  bin/yt-dlp      preserved
```

### Process management

**Systemd (recommended):**
```bash
sudo systemctl status abyndotxyz
sudo journalctl -u abyndotxyz -f -n 100
```

**PM2 (alternative):**
```bash
bun install -g pm2
pm2 start /var/www/abyndotxyz/ecosystem.config.js
pm2 save && pm2 startup
```

---

## Architecture

```
Spotify API  ──→  sync.ts  ──→  MusicPlayerContext  ──→  Audio Player  ──→  UI
Last.fm API  ──→  lastfm.ts
Lanyard WS   ──→  useLanyard()  ──→  index.tsx
Open-Meteo   ──→  /api/weather

KV (bun:sqlite)  ──→  badges, activity history, weather cache, lyrics, canvas URLs
yt-dlp / Paxsenix  ──→  audio stream resolution
```

**Key files:**
| File | Purpose |
|---|---|
| `src/lib/kv.ts` | SQLite-backed key-value store (replaces Redis) |
| `src/lib/music/sync.ts` | Spotify polling and playback synchronization |
| `src/lib/music/audio-player.ts` | HTML5 Audio + Web Audio API engine |
| `src/lib/music/extractor.ts` | Stream resolution (Paxsenix → yt-dlp fallback) |
| `src/components/music/MusicPlayerContext.tsx` | Global music state |
| `src/pages/api/discord-activities.ts` | Persists Discord activity history to KV |
| `src/pages/api/admin/badges.ts` | Admin CRUD for web badges (stored in KV) |
| `deploy/setup.sh` | One-shot VPS setup (install Bun, yt-dlp, systemd) |
| `deploy/update.sh` | Graceful production deploy (atomic swap + restart) |

---

## API Reference

See [`docs/api.md`](./docs/api.md) for the full API endpoint documentation.

---

## License

MIT — see [LICENSE](./LICENSE)
