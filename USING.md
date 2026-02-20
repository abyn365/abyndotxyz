# Setup & Usage Guide

This guide will help you set up and customize your personal bio website using this template.

## 🌟 Live Example

See it in action at [https://abyn.xyz](https://abyn.xyz)

## 📋 Prerequisites

Before you begin, make sure you have:
- Node.js 18 or higher installed
- A Discord account (for Discord status)
- A Spotify account (for Spotify integration, optional)
- A GitHub account (for deployment)

## 🚀 Quick Start

### 1. Use the Template

Click the "Use this template" button on GitHub to create your own repository:
[https://github.com/abyn365/abyndotxyz](https://github.com/abyn365/abyndotxyz)

### 2. Clone Your Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 4. Run Locally

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your site.

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Spotify API (for music features)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# Umami Analytics (for visitor stats)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
NEXT_PUBLIC_UMAMI_URL=

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

### Setting Up Spotify Integration

#### Step 1: Create a Spotify Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in:
   - **App name**: Your choice (e.g., "My Personal Bio")
   - **App description**: Personal bio website
   - **Redirect URI**: `http://localhost:3000/api/callback`
5. Save the **Client ID** and **Client Secret**

#### Step 2: Get Your Refresh Token

Follow [this guide](https://leerob.io/blog/spotify-api-nextjs) by Lee Robinson, or use this quick method:

1. Visit this URL in your browser (replace `YOUR_CLIENT_ID`):
   ```
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/callback&scope=user-read-currently-playing%20user-read-recently-played%20user-top-read
   ```

2. You'll be redirected to a URL with a code parameter
3. Use that code to get your refresh token

You can also use online tools like [Spotify Refresh Token Generator](https://spotify-refresh-token.onrender.com/)

### Setting Up Discord Status

#### Step 1: Add Lanyard Bot

1. Visit [Lanyard Discord Bot](https://discord.com/oauth2/authorize?client_id=783684813058277386&permissions=274878024704&scope=bot%20applications.commands)
2. Authorize the bot to your server
3. Join the [Lanyard Discord Server](https://discord.gg/MPKXhA3ZK7)

#### Step 2: Get Your Discord User ID

1. Open Discord
2. Go to Settings → Advanced
3. Enable "Developer Mode"
4. Right-click on your profile → Copy User ID

#### Step 3: Update the Code

In `pages/index.tsx`, find line 76 and replace the Discord user ID:

```typescript
const response = await fetch('https://api.lanyard.rest/v1/users/YOUR_DISCORD_ID');
```

Also update the user ID in `pages/api/discord-status.ts` if you want to use that API endpoint.

### Setting Up Umami Analytics (Optional)

1. Deploy Umami or use a hosted instance
2. Create a website in Umami dashboard
3. Copy the **Website ID**
4. Add to your `.env.local`:
   ```env
   NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id
   NEXT_PUBLIC_UMAMI_URL=https://your-umami-url.com
   ```

## 🎨 Customization

### Personal Information

Edit `pages/index.tsx` to customize:

```typescript
// Line 34-35
const belowLink = ""; // Text below your username
const bio = "Your bio text here"; // Your bio/description
```

### Brand Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      banner: "#c5a78b", // Accent color for tags and highlights
      primary: "#121212", // Main background color
    },
  },
}
```

### Social Links

In `pages/index.tsx` (around line 245), update your social media links:

```tsx
<a
  href="https://instagram.com/YOUR_USERNAME"
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  {/* Instagram icon */}
</a>
```

Each social link button redirects to a route (e.g., `/instagram`), which you can set up as redirects to your actual profiles.

### Profile Images

Replace these files in the `public/` directory:
- `profile.png` - Your profile picture (400x400 recommended)
- `banner.png` - Your site banner (1200x630 recommended for OG)
- `favicon.ico` - Favicon
- `favicon.png` - PNG favicon

## 📱 Deployment

### Deploy to Vercel

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your repository
4. Add your environment variables from `.env.local`
5. Click "Deploy"
6. Your site will be live at `https://your-project.vercel.app`

#### Step 3: Custom Domain (Optional)

1. In Vercel, go to your project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Deploy to Other Platforms

This project works on any Next.js-compatible platform:

**Netlify:**
```bash
npm run build
# Drag and drop the .next folder to Netlify
```

**Railway:**
```bash
# Connect your GitHub repo
# Railway will auto-detect Next.js
```

## 🔧 Advanced Configuration

### API Routes

The project includes several API routes:

- `/api/now-playing` - Currently playing Spotify track
- `/api/top-tracks` - Top tracks (supports 1M/6M/1Y periods)
- `/api/discord-status` - Discord status from Lanyard
- `/api/visitor-stats` - Visitor statistics from Umami

### Animations

Customize animations in these files:
- `components/Squares.tsx` - Background squares animation
- `pages/index.tsx` - Motion animations using Framer Motion
- AOS configuration in `pages/index.tsx` line 67-72

### Styling

Global styles are in `styles/globals.scss` or `styles/globals.css`.
Tailwind is configured in `tailwind.config.js`.

## 📊 Analytics & Monitoring

### Built-in Stats

The site displays:
- Active visitors (last 5 minutes)
- Total page views
- Unique visitors

### External Analytics

You can also use:
- **Vercel Analytics**: Add `@vercel/analytics` (included)
- **Google Analytics**: Add your GA ID to `.env.local`
- **Umami**: Set up as described above

## 🐛 Troubleshooting

### Discord Status Not Showing
- Verify Lanyard bot is in your server
- Check your Discord user ID is correct
- Ensure you're not invisible on Discord
- Check browser console for errors

### Spotify Not Working
- Verify your Spotify credentials in `.env.local`
- Ensure your refresh token is valid
- Check Spotify app redirect URIs
- Make sure you have a Spotify Premium account for full features

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

### Styling Issues
```bash
# Rebuild Tailwind
npm run build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Lanyard Documentation](https://github.com/Phineas/lanyard)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

## 💡 Tips & Best Practices

1. **Optimize Images**: Use Next.js `<Image />` component for all images
2. **SEO**: Update meta tags in `pages/_document.tsx` or use `next-seo`
3. **Performance**: Test with Lighthouse and address warnings
4. **Accessibility**: Ensure proper alt tags and ARIA labels
5. **Security**: Never commit `.env.local` files to GitHub
6. **Regular Updates**: Keep dependencies up to date

## 🤝 Support

If you need help:
- Check the [GitHub Issues](https://github.com/abyn365/abyndotxyz/issues)
- Visit the original template's [Discord Server](https://discord.gg/2pkvB82NaS)
- Create a new issue with detailed information

## 📝 Credits

This template is based on [personal-bio](https://github.com/lrmn7/personal-bio) by [lrmn7](https://github.com/lrmn7).

---

**Made with ❤️ by [abyn](https://abyn.xyz)**
