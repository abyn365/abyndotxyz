# How to Use This Template

A comprehensive guide to setting up and customizing your personal bio website.

- ⭐ Star the repository to show your support
- 💬 Need help? [Join the Discord](https://discord.gg/2pkvB82NaS)

## Table of Contents

- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Customization](#customization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### 1. Use the Template

Click the **"Use this template"** button on the GitHub repository to create your own copy.

### 2. Clone and Run Locally

```bash
# Clone your new repository
git clone <your-repo-url>
cd <your-repo-name>

# Install dependencies
npm install    # for npm
# or
yarn install   # for yarn
# or
pnpm install   # for pnpm

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# ========================
# Spotify API Credentials
# ========================
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here

# ========================
# Umami Analytics
# ========================
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id_here
NEXT_PUBLIC_UMAMI_API_KEY=your_api_key_here
```

### Getting Spotify Credentials

Follow these steps to get your Spotify API credentials:

#### Step 1: Create a Spotify Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the app details:
   - **App name:** Your choice (e.g., "Personal Bio")
   - **App description:** Your choice
   - **Redirect URI:** `http://localhost:3000/api/auth/callback/spotify`
   - **What are you building:** Personal, non-commercial

#### Step 2: Get Your Credentials

1. After creating the app, you'll see:
   - **Client ID** - Copy this
   - **Client Secret** - Click "View Client Secret" and copy it

#### Step 3: Generate Refresh Token

The easiest way is to use [this guide](https://leerob.io/blog/spotify-api-nextjs) or follow these steps:

1. Visit this URL in your browser (replace placeholders):
   ```
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000&scope=user-read-private%20user-read-email%20user-top-read%20user-read-currently-playing
   ```

2. Authorize the application when prompted
3. You'll be redirected to a URL with a `code` parameter
4. Use that code to exchange for a refresh token:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000"
```

The response will include your `refresh_token`.

### Getting Umami Analytics

#### Step 1: Set Up Umami

1. Go to [Umami.is](https://umami.is) and sign up
2. Set up your own instance or use their cloud service

#### Step 2: Create a Website

1. In your Umami dashboard, click **"Add website"**
2. Enter your website details (name, domain)
3. Copy the **Website ID** from the website settings

#### Step 3: Generate API Key

1. Go to **Settings** → **API Keys**
2. Create a new API key
3. Copy the API key

## Customization

### Profile Information

#### Update Discord User ID

Edit `pages/api/discord-status.ts`:

```typescript
const DISCORD_ID = "877018055815868426"; // Replace with your Discord user ID
```

To find your Discord user ID:
- Enable Developer Mode in Discord Settings → Advanced
- Right-click your name and select "Copy User ID"

#### Update Profile Bio

Edit `pages/index.tsx`:

```typescript
const belowLink = "";
const bio = "The biolink of a dumbass 🗿"; // Your bio text
```

#### Update Links

In `pages/index.tsx`, find and modify the social links section:

```typescript
// Example of updating a link
<Link href="/github">
  <GitHub />
</Link>
```

### Customize Colors

Edit `tailwind.config.js` to change your brand colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        banner: "#c5a78b",  // Your brand accent color
        primary: "#121212", // Background color
      },
    },
  },
}
```

### Customize Fonts

The project uses Jost and Sen fonts. To change them:

1. Install new fonts via npm:
   ```bash
   npm install @fontsource/your-font-name
   ```

2. Import in `pages/_app.tsx`:
   ```typescript
   import '@fontsource/your-font-name';
   ```

3. Update `tailwind.config.js`:
   ```javascript
   module.exports = {
     theme: {
       extend: {
         fontFamily: {
           yourfont: ["YourFontName", "sans-serif"],
         },
       },
     },
   }
   ```

### Update Redirects

Edit `next.config.js` to update social media redirects:

```javascript
async redirects() {
  return [
    {
      source: '/github',
      destination: 'https://github.com/yourusername',
      permanent: true,
    },
    {
      source: '/instagram',
      destination: 'https://instagram.com/yourusername',
      permanent: true,
    },
    // Add more redirects as needed
  ];
}
```

### Discord Integration Setup

To use the Discord status feature:

1. **Join Lanyard Discord:**
   - Join the [Lanyard Discord server](https://discord.gg/lanyard)

2. **Add Lanyard Bot:**
   - Invite the Lanyard bot to your server
   - The bot will automatically start tracking your presence

3. **Enable Rich Presence:**
   - Make sure Discord Rich Presence is enabled in your Discord settings
   - Your activity will now be tracked and displayed on your site

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **"New Project"**
   - Import your repository

3. **Configure Environment Variables:**
   - In the Vercel project settings, add your environment variables
   - Add all variables from your `.env.local` file

4. **Deploy:**
   - Click **"Deploy"**
   - Wait for the deployment to complete

5. **Your Site is Live:**
   - You'll get a URL like `https://your-project.vercel.app`

### Deploy to Other Platforms

#### Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in site settings

#### Cloudflare Pages

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set build output directory: `.next`
4. Add environment variables

#### Railway

1. Create a new project
2. Connect your GitHub repository
3. Add environment variables
4. Deploy automatically

## Troubleshooting

### Spotify Issues

**Issue:** "Failed to fetch now playing" or "Spotify rate limited"

**Solution:**
- Check your Spotify credentials in `.env.local`
- Ensure your refresh token is valid
- The app has built-in rate limit handling with fallback cache

### Discord Status Not Showing

**Issue:** Discord status not displaying

**Solution:**
- Verify your Discord user ID is correct
- Make sure you've added the Lanyard bot to your server
- Check that Discord Rich Presence is enabled
- Ensure you have an active Discord session

### Umami Analytics Not Working

**Issue:** Visitor stats showing 0 or error

**Solution:**
- Verify your Umami website ID and API key
- Check that your Umami instance is accessible
- Ensure your site's domain is registered in Umami

### Build Errors

**Issue:** TypeScript or build errors

**Solution:**
```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Port Already in Use

**Issue:** Error when running `npm run dev`

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

## Feature Guide

### Music Page

The `/music` page displays your top Spotify tracks with period selection:
- **1M:** Top tracks from the last month
- **6M:** Top tracks from the last 6 months
- **1Y:** Top tracks from the last year

Each track shows:
- Album art
- Track title and artist
- Spotify embed player
- Genre information

### Discord Activity Carousel

The carousel shows:
- Your current Discord activity (game, app, etc.)
- Currently playing Spotify track
- Custom Discord status with emoji

Features:
- Auto-rotates every few seconds
- Swipeable on mobile
- Hover to pause rotation
- Shows active device (Desktop, Web, Mobile)

### Visitor Stats Widget

Displays real-time statistics:
- **Active Users:** Visitors in the last 5 minutes
- **Pageviews:** Total page views today
- **Unique Visitors:** Unique visitors today

Updates every 30 seconds.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Lanyard API](https://github.com/Phineas/lanyard)
- [Umami Documentation](https://umami.is/docs)

## Support

- 📖 [Documentation](https://github.com/lrmn7/personal-bio)
- 💬 [Discord Server](https://discord.gg/2pkvB82NaS)
- 🐛 [Report Issues](https://github.com/lrmn7/personal-bio/issues)

---

Made with ❤️ by [lrmn7](https://github.com/lrmn7)
