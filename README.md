# Bio With Spotify

A personal bio/links website template built with Next.js, TypeScript, and Tailwind CSS. Features real-time Discord status, Spotify integration, and visitor analytics.

> Note: This is a template, feel free to use it. Star it if you like it! :P

![Banner](/public/banner.png)

## Features

- 🎵 **Spotify Integration** - Display your currently playing song and top tracks
- 💬 **Discord Status** - Real-time Discord presence with custom status and activity via Lanyard API
- 📊 **Visitor Analytics** - Live visitor statistics using Umami Analytics
- ⚡ **Fast & Responsive** - Optimized with Next.js, SEO-friendly, and fully responsive
- 🎨 **Customizable** - Personalize with your own brand colors and content
- ✨ **Animated UI** - Smooth animations with Framer Motion and AOS
- 📱 **Mobile-Optimized** - Great experience on all devices
- 🔄 **Smart Caching** - Uses Vercel KV for efficient API caching

## 🌐 [Live Demo](https://hi-lrmn.is-a.dev)

Showcase all your important links in one place with a sleek, modern design.

## Tech Stack

- **Framework:** Next.js 15 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme
- **Animations:** Framer Motion, AOS
- **Caching:** Vercel KV
- **Analytics:** Umami Analytics
- **Fonts:** Jost, Sen (via @fontsource)

## Installation

### Clone the repository

```sh
git clone https://github.com/lrmn7/personal-bio.git
cd personal-bio
```

### Install dependencies

```sh
npm install    # for npm
yarn install   # for yarn
pnpm install   # for pnpm
```

### Start the development server

```sh
npm run dev    # for npm
yarn dev       # for yarn
pnpm dev       # for pnpm
```

Open [http://localhost:3000](http://localhost:3000) to view your site.

## Usage

### Step 1: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
NEXT_PUBLIC_UMAMI_API_KEY=your_umami_api_key
```

#### Getting Spotify Credentials

Follow [Lee Rob's guide](https://leerob.io/blog/spotify-api-nextjs) to get your Spotify API credentials:
1. Create a Spotify application in the Spotify Developer Dashboard
2. Set the redirect URI to `http://localhost:3000/api/auth/callback/spotify`
3. Generate your refresh token using the OAuth flow

#### Getting Umami Analytics

1. Set up an [Umami Analytics](https://umami.is) instance
2. Create a website in your Umami dashboard
3. Copy your website ID and generate an API key

### Step 2: Customize Your Content

Edit the following files to personalize your site:

**Profile Info:**
- Update your Discord user ID in `pages/api/discord-status.ts`
- Update your bio and links in `pages/index.tsx`

**Colors & Styling:**
- Modify brand colors in `tailwind.config.js`
- Adjust fonts and design tokens as needed

**Redirects:**
- Update social media redirects in `next.config.js`

### Step 3: Discord Integration

To display your Discord status:
1. Join the [Lanyard Discord server](https://discord.gg/lanyard)
2. Add the Lanyard bot to your server
3. The bot will automatically track your Discord presence
4. Update your Discord user ID in the code

## Project Structure

```
├── components/
│   ├── Misc/
│   │   ├── DiscordStatus.misc.tsx    # Discord activity carousel
│   │   ├── TopTracks.misc.tsx         # Spotify top tracks display
│   │   └── VisitorStats.misc.tsx      # Visitor analytics widget
│   ├── Squares.tsx                    # Animated background
│   └── Banner.jsx                     # Banner component
├── pages/
│   ├── api/
│   │   ├── now-playing.ts             # Current Spotify track
│   │   ├── top-tracks.ts              # Top tracks with KV caching
│   │   ├── discord-status.ts          # Discord status via Lanyard
│   │   └── visitor-stats.ts           # Umami analytics stats
│   ├── index.tsx                      # Main profile page
│   └── music.tsx                      # Dedicated music page
├── lib/
│   └── spotify.ts                     # Spotify API utilities
└── public/                            # Static assets
```

## Key Features Explained

### Spotify Integration

- **Now Playing:** Displays the currently playing track with album art
- **Top Tracks:** Shows top tracks with 1 Month, 6 Months, and 1 Year options
- **Smart Caching:** Uses Vercel KV to cache responses and handle rate limits
- **Artist Genres:** Fetches and displays artist genres for each track

### Discord Status

- **Real-time Updates:** Polls Lanyard API every 10 seconds
- **Activity Display:** Shows current game/app activity with details
- **Custom Status:** Displays custom status with emoji support
- **Device Detection:** Shows active device (Desktop, Web, Mobile)
- **Carousel UI:** Swipeable carousel for Discord and Spotify activities

### Visitor Analytics

- **Live Stats:** Shows active users, pageviews, and unique visitors
- **Daily Updates:** Statistics reset and update daily
- **Error Handling:** Gracefully fails if API is unavailable

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/dashboard)
3. Click "New Project" and import your repository
4. Add environment variables in the Vercel dashboard
5. Click "Deploy"

Your site will be live at `https://your-project.vercel.app`

### Other Platforms

This Next.js project can be deployed to:
- Netlify
- Railway
- Cloudflare Pages
- Any platform supporting Next.js

## Customization

### Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      banner: "#c5a78b",  // Brand accent color
      primary: "#121212", // Dark background
    },
  },
}
```

### Fonts

The project uses Jost and Sen fonts via @fontsource. You can modify these in `tailwind.config.js` or add your own fonts.

### Social Links

Update the redirects in `next.config.js` to point to your social profiles:

```js
{
  source: '/github',
  destination: 'https://github.com/yourusername',
  permanent: true,
}
```

## License

This project is open source and available under the [MIT License](LICENSE).

## 💌 Support

Need help? Connect with the community:

- [Discord Server](https://discord.gg/6EXgrmtkPX)
- [Open an Issue](https://github.com/lrmn7/personal-bio/issues)

---

Made with ❤️ by [lrmn7](https://github.com/lrmn7)
