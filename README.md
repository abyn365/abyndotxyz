# Abyndotxyz - Personal Bio & Links

> A modern personal bio/links website template built with Next.js, TypeScript, and Tailwind CSS. Features real-time Discord status, Spotify integration, and visitor analytics.

![Banner](/public/banner.png)

## 🌟 Live Demo

Check out my personal website at [https://abyn.xyz](https://abyn.xyz)

## ✨ Features

### Core Features
- **Real-time Discord Status Integration**
  - Live Discord presence via Lanyard API
  - Custom status with emoji support
  - Current activity display (games, apps, etc.)
  - Interactive swipeable carousel for Discord/Spotify activity

- **Spotify Integration**
  - Currently playing song display with album art
  - Top tracks showcase with 1M/6M/1Y period selection
  - Artist and album information
  - Direct song links to Spotify

- **Visitor Analytics Dashboard**
  - Real-time active visitors count
  - Page views and unique visitors statistics
  - Powered by Umami Analytics API
  - Auto-refreshing stats

### Design & Performance
- Modern dark theme with elegant animations
- Framer Motion for smooth transitions
- Responsive design (mobile-optimized)
- AOS (Animate On Scroll) library integration
- Custom animated background squares
- SEO optimized with next-seo
- Fast loading and optimized images

### Technical Stack
- **Framework**: Next.js 15 with TypeScript (Pages Router)
- **Styling**: Tailwind CSS with custom theme
- **Animations**: Framer Motion + AOS
- **State Management**: React hooks + SWR
- **Data Fetching**: Server-side API routes
- **Caching**: Vercel KV for performance
- **Icons**: React Icons + Custom SVGs

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository

```bash
git clone https://github.com/abyn365/abyndotxyz.git
cd abyndotxyz
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Spotify API Credentials (for now-playing and top-tracks)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Umami Analytics (for visitor stats)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Getting Spotify Credentials

Follow [this guide](https://leerob.io/blog/spotify-api-nextjs) by Lee Robinson to get your Spotify API credentials.

#### Discord/Lanyard Setup

1. Add the [Lanyard bot](https://discord.com/oauth2/authorize?client_id=783684813058277386&permissions=274878024704&scope=bot%20applications.commands) to your Discord server
2. Join their [Discord server](https://discord.gg/MPKXhA3ZK7)
3. Get your Discord User ID
4. Update the user ID in `pages/index.tsx` (line 76)

### Customization

#### Profile Information

Update your profile in `pages/index.tsx`:

```typescript
const belowLink = ""; // Text below your name
const bio = "Your bio text here"; // Your bio
```

Update your Discord user ID:
```typescript
const response = await fetch('https://api.lanyard.rest/v1/users/YOUR_DISCORD_ID');
```

#### Brand Colors

Customize the color scheme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      banner: "#c5a78b", // Your accent color
      primary: "#121212", // Main background
    },
  },
}
```

#### Social Links

Update social links in `pages/index.tsx` around line 245. Each link is a button that redirects to a specific route (e.g., `/instagram`, `/github`, etc.).

## 📂 Project Structure

```
abyndotxyz/
├── components/
│   ├── Banner.jsx           # Profile tags/interests
│   ├── Squares.tsx          # Animated background
│   └── Misc/
│       ├── DiscordStatus.misc.tsx   # Discord status component
│       ├── TopTracks.misc.tsx       # Spotify top tracks
│       └── VisitorStats.misc.tsx    # Visitor statistics
├── pages/
│   ├── api/
│   │   ├── discord-status.ts       # Discord status API
│   │   ├── now-playing.ts           # Now playing API
│   │   ├── top-tracks.ts            # Top tracks API
│   │   └── visitor-stats.ts         # Visitor stats API
│   ├── index.tsx            # Main page
│   └── music.tsx            # Music page
├── public/                  # Static assets
├── styles/                  # Global styles
└── tailwind.config.js       # Tailwind configuration
```

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/dashboard)
3. Click "New Project" and import your repository
4. Add environment variables
5. Click "Deploy"

### Other Platforms

This project can be deployed to any platform that supports Next.js, such as:
- Netlify
- Railway
- Render
- Your own VPS

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 Credits

This project is based on the excellent [personal-bio](https://github.com/lrmn7/personal-bio) template by [lrmn7](https://github.com/lrmn7).

Original template: [https://github.com/lrmn7/personal-bio](https://github.com/lrmn7/personal-bio)

My fork: [https://github.com/abyn365/abyndotxyz](https://github.com/abyn365/abyndotxyz)

### Key Integrations
- [Lanyard](https://github.com/Phineas/lanyard) - Discord presence API
- [Spotify Web API](https://developer.spotify.com/) - Music integration
- [Umami Analytics](https://umami.is/) - Privacy-focused analytics
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ by [abyn](https://abyn.xyz)**

[![GitHub followers](https://img.shields.io/github/followers/abyn365?style=social)](https://github.com/abyn365)
[![GitHub stars](https://img.shields.io/github/stars/abyn365/abyndotxyz?style=social)](https://github.com/abyn365/abyndotxyz)
