# How to Use This Template

This guide will walk you through setting up and customizing your personal bio page.

## Getting Started

### 1. Fork or Use the Template

Click the "Use this template" button on the GitHub repository to create your own copy.

### 2. Clone Locally

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 4. Run Development Server

```bash
npm run dev
```

Your site will be available at [http://localhost:3000](http://localhost:3000)

## Customizing Your Profile

### Adding Your Information

Edit the `data.json` file in the `public` folder:

```json
{
  "name": "Your Name",
  "tagline": "Your tagline or bio",
  "links": [
    {
      "name": "GitHub",
      "url": "https://github.com/yourusername",
      "icon": "github"
    },
    {
      "name": "Twitter",
      "url": "https://twitter.com/yourusername",
      "icon": "twitter"
    }
  ],
  "tags": ["Developer", "Designer", "Open Source"]
}
```

### Customizing Colors

Edit `tailwind.config.js` to change the theme colors:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',    // Main brand color
        secondary: '#8b5cf6',  // Secondary color
        background: '#0f0f0f', // Background color
        foreground: '#ffffff'  // Text color
      }
    }
  }
}
```

## Optional Integrations

### Spotify Now Playing

To display your currently playing Spotify song:

1. Create a Spotify Developer Application at [developer.spotify.com](https://developer.spotify.com)
2. Get your Client ID and Client Secret
3. Generate a refresh token (see [Lee Robinson's guide](https://leerob.io/blog/spotify-api-nextjs))
4. Add to `.env.local`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

### Umami Analytics

To track visitor statistics:

1. Set up Umami or use cloud umami
2. Get your website ID
3. Add to `.env.local`:

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id
```

### Discord Status (Lanyard)

The Discord status is automatically displayed using Lanyard API. Edit the Discord user ID in the components to show your status.

## Deploying to Production

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Add environment variables if needed
6. Click "Deploy"

Your site will be live at `your-project.vercel.app`

### GitHub Pages

1. Update `next.config.js` with your domain
2. Push to main branch
3. Go to repository settings
4. Enable GitHub Pages
5. Select "Deploy from branch"
6. Choose `main` branch and `root` folder

## Troubleshooting

### Build Errors

- Make sure Node.js version is 18 or higher
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

### Environment Variables Not Working

- Restart the development server after adding env variables
- Ensure `.env.local` is in the project root

### Styling Issues

- Check that Tailwind CSS is properly configured
- Clear cache: `rm -rf .next`

## Support

If you need help:

- Join our [Discord server](https://discord.gg/your-invite-code)
- Open an issue on GitHub

## License

MIT License - feel free to use this template for your own projects!
