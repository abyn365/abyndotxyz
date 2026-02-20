# Lanyard Integration Guide

This guide explains how the Discord status integration works in this project using the Lanyard API.

## What is Lanyard?

Lanyard is a service that provides real-time Discord presence data via API and WebSocket connections. It allows you to:
- Display your Discord status on your website
- Show your current activity (games, apps, music)
- Display custom status with emoji support
- Track Spotify activity and Rich Presence

## How This Project Uses Lanyard

This project uses the Lanyard REST API to fetch Discord presence data and display it in a beautiful carousel component.

### API Implementation

The Discord status is fetched via `pages/api/discord-status.ts`:

```typescript
const DISCORD_ID = "877018055815868426";

export default async function handler(req, res) {
  const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
  const data = await response.json();
  // Process and return Discord activity data
}
```

### Response Structure

The Lanyard API returns data in this structure:

```typescript
{
  data: {
    discord_user: {
      id: string,
      username: string,
      avatar: string,
      discriminator: string,
      // ... other user info
    },
    discord_status: "online" | "idle" | "dnd" | "offline",
    activities: [
      {
        id: string,
        name: string,        // "Spotify", "Visual Studio Code", etc.
        type: number,        // 0=playing, 2=listening, 4=custom
        state: string,       // Additional details
        details: string,     // Main details
        assets: {
          large_image: string,  // Activity image URL
          small_image: string,  // App/small icon
          large_text: string,
          small_text: string
        },
        // ... timestamps, buttons, etc.
      }
    ],
    spotify: {
      song: string,
      artist: string,
      album: string,
      album_art_url: string,
      timestamps: { start, end }
      // ... if listening to Spotify
    },
    active_on_discord_desktop: boolean,
    active_on_discord_web: boolean,
    active_on_discord_mobile: boolean
  },
  success: boolean
}
```

## Setup Guide

### Step 1: Get Your Discord User ID

1. Open Discord
2. Go to **Settings** → **Advanced**
3. Enable **Developer Mode**
4. Right-click on your username/profile picture
5. Select **Copy User ID**

### Step 2: Join Lanyard

1. Join the [Lanyard Discord server](https://discord.gg/lanyard)
2. This is required for the Lanyard bot to track your status

### Step 3: Add Lanyard Bot to Your Server

You can invite the Lanyard bot using [this invite link](https://discord.com/api/oauth2/authorize?client_id=809030254131703868&permissions=0&scope=bot%20applications.commands).

**Note:** The bot doesn't need any special permissions - it just needs to be in a server you're in.

### Step 4: Configure Your Project

Update your Discord user ID in `pages/api/discord-status.ts`:

```typescript
const DISCORD_ID = "YOUR_DISCORD_USER_ID";
```

## Features in This Project

### Real-Time Status

The component polls the Lanyard API every 10 seconds to get the latest status:

```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/discord-status');
    const data = await response.json();
    setStatus(data);
  };

  fetchData();
  const poll = setInterval(fetchData, 10000);
  return () => clearInterval(poll);
}, []);
```

### Activity Types Supported

The carousel displays different types of activities:

1. **Games** (type 0):
   - Shows the game name and details
   - Displays game artwork if available

2. **Listening to Spotify** (type 2):
   - Song title and artist
   - Album art
   - Progress bar (if available)

3. **Custom Status** (type 4):
   - Custom text status
   - Emoji support (animated and static)

4. **Watching/Streaming** (type 3):
   - Video/stream title
   - Platform name
   - Thumbnail if available

### Image Handling

The code handles different image formats:

```typescript
const getImageUrl = (activity) => {
  // PreMiD format (with external images)
  if (activity.assets?.large_image?.startsWith('mp:external/')) {
    const imageUrl = activity.assets.large_image
      .split('/https/')[1]
      ?.replace(/%25/g, '%')
      ?.replace(/\/assets\/\d+\.png$/, '/assets/logo.png');
    return `https://${imageUrl}`;
  }

  // Spotify album art
  if (activity.name === 'Spotify' && activity.assets?.large_image) {
    const spotifyImageId = activity.assets.large_image.replace('spotify:', '');
    return `https://i.scdn.co/image/${spotifyImageId}`;
  }

  return null;
};
```

### Device Detection

The API shows which device you're active on:

```typescript
const getActiveDevice = (data) => {
  if (data.active_on_discord_desktop) return 'Desktop';
  if (data.active_on_discord_web) return 'Web';
  if (data.active_on_discord_mobile) return 'Mobile';
  return null;
};
```

## The Carousel Component

The `DiscordStatus` component (`components/Misc/DiscordStatus.misc.tsx`) displays:

### Slides

1. **Discord Activity Slide**
   - Current game/app name
   - Activity details and state
   - Activity image/artwork
   - Active device indicator

2. **Spotify Slide**
   - Currently playing song
   - Artist name
   - Album art
   - Play state indicator

### Interactions

- **Auto-rotation:** Slides change automatically every 5 seconds
- **Hover to pause:** Rotation pauses when hovering over the carousel
- **Swipe support:** Drag/swipe on mobile to change slides
- **Manual navigation:** Click arrow buttons to navigate

## Customization

### Change Polling Interval

Edit `components/Misc/DiscordStatus.misc.tsx`:

```typescript
const poll = setInterval(fetchData, 10000); // 10 seconds
```

### Modify Status Icons

Update the status images in `pages/api/discord-status.ts`:

```typescript
export const statusImages = {
  online: 'https://cdn3.emoji.gg/emojis/1514-online-blank.png',
  idle: 'https://cdn3.emoji.gg/emojis/5204-idle-blank.png',
  dnd: 'https://cdn3.emoji.gg/emojis/4431-dnd-blank.png',
  offline: 'https://cdn3.emoji.gg/emojis/6610-invisible-offline-blank.png'
};
```

### Change Carousel Timing

Modify the rotation timer in the component:

```typescript
const ROTATION_DELAY = 5000; // 5 seconds
```

### Styling

Customize the appearance in `components/Misc/DiscordStatus.misc.tsx`:

```typescript
// Discord slide colors
accentColor: 'text-indigo-400',
bgColor: 'from-indigo-500/[0.03] via-indigo-500/[0.02] to-transparent',
borderColor: 'border-indigo-500/20'

// Spotify slide colors
accentColor: 'text-green-400',
bgColor: 'from-green-500/[0.03] via-green-500/[0.02] to-transparent',
borderColor: 'border-green-500/20'
```

## Using WebSocket (Advanced)

For real-time updates without polling, you can use the Lanyard WebSocket API:

```typescript
import { useLanyard } from "react-use-lanyard";

function App() {
  const { loading, status } = useLanyard({
    userId: "952574663916154960",
    socket: true,
  });

  return <pre>{!loading && JSON.stringify(status, null, 4)}</pre>;
}
```

### Benefits of WebSocket
- Instant updates when status changes
- No polling overhead
- Better for frequently changing statuses

### Drawbacks
- Requires keeping WebSocket connection open
- More complex implementation
- May have connection issues in some environments

## Common Issues

### Status Not Updating

**Problem:** Status shows old or no data

**Solutions:**
1. Verify your Discord user ID is correct
2. Make sure you're in a server with the Lanyard bot
3. Check that Discord Rich Presence is enabled
4. Ensure you have an active Discord session
4. Try changing your status to trigger an update

### Images Not Showing

**Problem:** Activity images don't display

**Solutions:**
1. Some games/apps don't provide images
2. External images may be blocked by Discord
3. Check your Next.js image domains in `next.config.js`

### Rate Limiting

**Problem:** API returns rate limit errors

**Solutions:**
1. The current implementation polls every 10 seconds (well within limits)
2. If you need faster updates, consider WebSocket
3. The API has built-in rate limit handling

## API Endpoints

### Get User Status (REST)

```
GET https://api.lanyard.rest/v1/users/{DISCORD_ID}
```

### Multiple Users

```
GET https://api.lanyard.rest/v1/users/{USER_ID_1},{USER_ID_2},{USER_ID_3}
```

### WebSocket

```
wss://api.lanyard.rest/socket
```

Send subscription message:
```json
{
  "op": 2,
  "d": {
    "subscribe_to_id": "DISCORD_ID"
  }
}
```

## KV Store Integration

Lanyard also supports a key-value store:

### Set KV Pair

```typescript
import { set } from "react-use-lanyard";

await set({
  apiKey: "your_api_key", // Get from Lanyard bot
  userId: "your_user_id",
  key: "test_key",
  value: "test value",
});
```

### Get KV Pair

Available via the REST API response in `data.kv` object.

## Resources

- [Lanyard GitHub](https://github.com/Phineas/lanyard)
- [Lanyard Discord](https://discord.gg/lanyard)
- [Lanyard API Docs](https://github.com/Phineas/lanyard/blob/master/README.md#api)
- [react-use-lanyard](https://github.com/MacFJA/react-use-lanyard)

## Support

If you encounter issues with Lanyard integration:
- Check the [Lanyard Discord server](https://discord.gg/lanyard)
- Review the [Lanyard documentation](https://github.com/Phineas/lanyard)
- Open an issue on the project repository

---

**Note:** This project uses the REST API for simplicity. For production applications with high traffic, consider implementing WebSocket connections for better performance.
