# Personal Bio - Links & Portfolio Template

A modern, customizable personal bio/links website template built with Next.js, TypeScript, and Tailwind CSS. Features real-time Discord status, Spotify integration, and visitor analytics.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ Features

- **Real-time Discord Status** - Display your Discord presence, custom status with emojis, and current activity using Lanyard API
- **Spotify Integration** - Show currently playing songs and top tracks (with 1M/6M/1Y period selection)
- **Visitor Analytics** - Built-in Umami Analytics integration for tracking visitors
- **Profile Tags** - Showcase your interests and skills
- **Responsive Design** - Fully optimized for mobile and desktop
- **Customizable** - Easy to customize colors, content, and branding
- **SEO Optimized** - Built with SEO best practices
- **Dark Theme** - Sleek dark mode by default with animated backgrounds

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + SASS/SCSS
- **Animations:** Framer Motion
- **Caching:** Vercel KV
- **Analytics:** Umami Analytics + Vercel Analytics
- **Fonts:** Jost, Sen

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git

# Navigate to the project directory
cd your-repo

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your site.

## ⚙️ Configuration

### Adding Your Data

Edit the `data.json` file in the `public` folder to add your personal information:

```json
{
  "name": "Your Name",
  "tagline": "Your tagline",
  "links": [
    {
      "name": "Your Link",
      "url": "https://example.com",
      "icon": "icon-name"
    }
  ]
}
```

### Customizing Colors

Edit `tailwind.config.js` to customize the theme colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        secondary: '#your-color',
      }
    }
  }
}
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Spotify API (optional)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=

# Umami Analytics (optional)
UMAMI_API_URL=
UMAMI_WEBSITE_ID=
```

For Spotify API setup, follow [Lee Robinson's guide](https://leerob.io/blog/spotify-api-nextjs).

## 📁 Project Structure

```
├── components/          # React components
├── lib/                 # Utility functions and API helpers
├── pages/               # Next.js pages and API routes
│   ├── api/            # API routes
│   └── index.tsx       # Main page
├── public/             # Static assets
│   └── data.json       # User data
├── styles/             # SASS/SCSS stylesheets
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── next.config.js      # Next.js configuration
```

## 🧪 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/import)

1. Push your code to GitHub
2. Import the project to Vercel
3. Configure environment variables
4. Deploy!

## 📄 License

MIT License - feel free to use this template for your own projects.

## 🤝 Support

Join our Discord server for support and discussions:

[![Discord](https://invidget.switchblade.xyz/your-invite-code)](https://discord.gg/your-invite-code)

---

⭐ Star the repo if you found this useful!
