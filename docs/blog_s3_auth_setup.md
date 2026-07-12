# Blog, S3 Storage, and Authentication Setup Guide

This guide covers configuring and running the secure login system, S3-compatible cloud storage blog system, and visitor interactive likes/comments.

---

## 1. Authentication Configuration

The administration dashboard uses `Bun.password` for cryptographic hashing and verification (with default Argon2id). Admin credentials are bound to a session ID and secured using `Bun.CSRF` (Cross-Site Request Forgery) protection.

### Environment Variables

Add the following keys to your `.env` or `.env.local` file:

```env
# Admin Dashboard Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-strong-password-here"
JWT_SECRET="generate-a-long-random-string-here"
```

### OS Keychain Integration (`Bun.secrets`)

For local development, Bun integrates natively with your operating system's system-level credential manager (Keychain Services on macOS, Windows Credential Manager, or `libsecret` on Linux).

1. **Automatic Synchronization**: On first login, if the credentials specified in `.env` are plaintext, the application will automatically upgrade the password to a secure Argon2id hash and store both the username and password hash in your OS keychain under the service `abyndotxyz`.
2. **Subsequent Runs**: The application will automatically attempt to query the OS keychain first. This prevents plaintext passwords from residing indefinitely in configuration files.

---

## 2. S3-Compatible Cloud Storage (Cloudflare R2)

The blog posts index, individual article content, uploaded images, post comments, and post likes are stored on an S3-compatible object storage provider (e.g. Cloudflare R2).

### Environment Variables

Configure S3 by adding the following credentials to your `.env` file:

```env
# S3 Cloud Storage Credentials (e.g., Cloudflare R2)
S3_ACCESS_KEY_ID="your-r2-access-key-id"
S3_SECRET_ACCESS_KEY="your-r2-secret-access-key"
S3_BUCKET="your-bucket-name"
S3_ENDPOINT="https://<your-cloudflare-account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
```

> [!TIP]
> **SQLite Database Fallback**
> If S3 credentials are not set up or are left blank, the blog system will automatically fall back to saving articles, comments, and likes to the local SQLite database (`kv.sqlite`). This allows you to run, edit, and test the entire blog system out-of-the-box without requiring a cloud setup.

---

## 3. Visitor Authentication & Likes/Comments

Visitors can register an optional account to like guestbook messages, like blog posts, and post comments on articles.

1. **Unified Session**: A single login/registration cookie (`visitor_session`) is used to identify the visitor.
2. **Security Hashing**: Visitor passwords are typed securely and hashed using Argon2id (`Bun.password.hash`) when registering, saving the credential in the SQLite database.
3. **Minimized UI**: The visitor account panel is collapsed by default under the **"Likes Account (Optional)"** or **"Account (Optional)"** dropdowns in the guestbook feed and blog posts to maintain a clean portfolio design.

---

## 4. Testing Locally

To start the local development server:

```bash
bun run dev
```

1. Open `http://localhost:3000/blog` to view the public blog list.
2. Open `http://localhost:3000/admin` to access the administrator panel. Log in using your configured credentials.
3. Test creating a post, uploading an image (requires S3 configured), editing content, and toggling draft status.
4. Open `http://localhost:3000/` and click the **Guestbook** tab to test visitor register/login, posting, and synchronized liking.

---

## 5. Spotify Integration & Canvas Config

The site integrates with Spotify to show live listening status, queue, top tracks, and Spotify Canvas video loops on the lyrics overlay page.

### Environment Variables

Configure Spotify by adding the following credentials to your `.env` file:

```env
# Spotify Developer API (OAuth)
SPOTIFY_CLIENT_ID="your-spotify-developer-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-developer-client-secret"
SPOTIFY_REFRESH_TOKEN="your-spotify-oauth-refresh-token"

# Spotify Canvas In-House Resolver (Optional, but highly recommended)
SPOTIFY_SP_DC="your-spotify-sp-dc-cookie-for-canvas"
```

### In-House Spotify Canvas Setup (`SPOTIFY_SP_DC`)

To fetch Spotify Canvas video loops privately in-house rather than relying on unreliable public APIs:

1. Open a web browser and go to [Spotify Web Player](https://open.spotify.com).
2. Log in with your Spotify account.
3. Open the browser **Developer Tools** (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`).
4. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox/Safari).
5. Click **Cookies** in the sidebar and select `https://open.spotify.com`.
6. Locate the cookie named `sp_dc` and copy its value.
7. Paste it in your `.env` file as `SPOTIFY_SP_DC="your_copied_value"`.

> [!NOTE]
> **Paxsenix Fallback**
> The `sp_dc` cookie acts as a persistent session indicator and typically lasts for 1 year. If `SPOTIFY_SP_DC` is not set or leaves empty, the application will automatically fall back to the public Paxsenix API.

