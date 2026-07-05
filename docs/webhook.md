# Discord Webhook Integration Guide

This guide covers configuring and troubleshooting the Discord Webhook notification system, which alerts you of new user activities and potential brute-force security threats.

---

## 1. Environment Variable Setup

The webhook system reads the webhook URL from your environment variables. 

To enable notifications, add the `DISCORD_WEBHOOK_URL` variable to your `.env` file in the project root:

```env
# Discord Webhook Configuration
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/your_webhook_id/your_webhook_token"
```

If `DISCORD_WEBHOOK_URL` is omitted, the webhook system will disable itself silently, ensuring that the application continues to run without throwing errors.

---

## 2. Triggered Events & Specifications

Every event is sent as a beautifully formatted rich embed payload containing key information:

### 💬 New Blog Comment
- **Endpoint**: `/api/blog/comment` (POST)
- **Embed Color**: `#00F773` (Green - Decimal `63347`)
- **Fields**:
  - `Post Slug`: The URL identifier of the post.
  - `Author`: Username of the commenter.
  - `Post URL`: A clickable link to the comment section on the live site.
- **Description**: The comment text content.

### 👤 New Visitor Registration
- **Endpoint**: `/api/visitor/auth/register` (POST)
- **Embed Color**: `#3178C6` (Blue - Decimal `3242182`)
- **Fields**:
  - `Username`: The registered visitor's username.
  - `Registered At`: Timestamp of registration.
- **Description**: Confirms the creation of a new visitor account.

### 📖 New Guestbook Entry
- **Endpoint**: `/api/guestbook` (POST)
- **Embed Color**: `#F7007F` (Pink - Decimal `16187519`)
- **Fields**:
  - `Name`: Author of the guestbook message.
  - `Timestamp`: Timestamp of post submission.
- **Description**: The guestbook message body.

### ✉️ New Guestbook Reply
- **Endpoint**: `/api/guestbook/reply` (POST)
- **Embed Color**: `#F1C40F` (Yellow - Decimal `15844367`)
- **Fields**:
  - `Author`: Replier's username.
  - `Parent Message ID`: ID of the message being replied to.
  - `Timestamp`: Timestamp of reply submission.
- **Description**: The reply text content.

### ⚠️ Security Alert: Login Brute-Force Attempts
- **Endpoints**: `/api/auth/login` (Admin panel login) and `/api/visitor/auth/login` (Visitor login)
- **Embed Color**: `#E74C3C` (Red - Decimal `16711680`)
- **Fields**:
  - `Target Username` / `Attempted Username`: Username target.
  - `IP Address`: Client IP address extracted securely.
  - `Total Failures (1hr)`: Current failed login count.
- **Trigger Condition**: Triggers on the 4th failed login attempt and any subsequent failure within a 1-hour window.
- **Reset Condition**: Resets to `0` upon a successful login.

---

## 3. Brute Force Protection Mechanics

To secure authentication endpoints without complex database overhead, the system leverages the built-in SQLite KV store (`src/lib/kv.ts`):

1. On a failed login request, the user's IP (and target username for visitor logins) is logged in KV:
   - Key: `failed_login_attempts:admin:${ip}` or `failed_login_attempts:visitor:${username}:${ip}`
   - Expiration TTL: `3600` seconds (1 hour)
2. Every subsequent failure increments the count.
3. Once the counter exceeds `3`, a high-priority webhook alert containing the target account name, the client IP address, and total failures is sent.
4. If a login succeeds, the key is immediately deleted from the database to prevent stale security flags.
