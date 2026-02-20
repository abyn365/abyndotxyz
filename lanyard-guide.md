# Lanyard Discord Integration Guide

This guide explains how to integrate Discord status into your personal bio website using the [Lanyard API](https://github.com/Phineas/lanyard).

## 📋 What is Lanyard?

Lanyard is a service that provides real-time Discord presence through a REST API and WebSocket connection. It allows you to display:
- Your Discord status (online, idle, dnd, offline)
- Custom status with emojis
- Current activity (games, apps, music)
- Spotify listening status

## 🚀 Setup Instructions

### Step 1: Add Lanyard Bot to Your Server

1. Visit the Lanyard bot authorization page:
   [https://discord.com/oauth2/authorize?client_id=783684813058277386&permissions=274878024704&scope=bot%20applications.commands](https://discord.com/oauth2/authorize?client_id=783684813058277386&permissions=274878024704&scope=bot%20applications.commands)

2. Authorize the bot to your server by clicking "Authorize"

3. Complete the CAPTCHA verification if prompted

### Step 2: Get Your Discord User ID

1. Open Discord and go to **Settings** (gear icon)
2. Navigate to **Advanced** under App Settings
3. Toggle **Developer Mode** to ON
4. Go back to your Discord server or DMs
5. Right-click on your username
6. Select **Copy User ID**

Your Discord User ID will look something like: `877018055815868426`

### Step 3: Update Your Code

In this project, you need to update your Discord User ID in two places:

#### 1. Main Page (`pages/index.tsx`)

Find line 76 and replace the user ID:

```typescript
// Before
const response = await fetch('https://api.lanyard.rest/v1/users/877018055815868426');

// After
const response = await fetch('https://api.lanyard.rest/v1/users/YOUR_DISCORD_USER_ID');
```

#### 2. API Route (`pages/api/discord-status.ts`)

If you're using the dedicated API route, update the user ID there as well:

```typescript
const USER_ID = 'YOUR_DISCORD_USER_ID';
```

### Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit [http://localhost:3000](http://localhost:3000)

3. Make sure you're **not** set to "Invisible" on Discord (set your status to Online, Idle, or DND)

4. You should see:
   - Your Discord profile picture
   - Your Discord status indicator (online, idle, etc.)
   - Your custom status with emoji (if set)
   - Current activity if you're playing a game or using an app

## 📊 API Response Format

The Lanyard API returns a JSON response with the following structure:

```typescript
{
  "data": {
    "kv": {}, // Key-value pairs (optional)
    "discord_user": {
      "id": "877018055815868426",
      "username": "yourusername",
      "avatar": "a_6e2d48748cb9c5faddd71f4e29450172",
      "discriminator": "0",
      "global_name": "Your Display Name",
      // ... more user data
    },
    "activities": [
      {
        "id": "custom",
        "name": "Custom Status",
        "type": 4,
        "emoji": {
          "id": "1114500435265458176",
          "name": "BlushCry",
          "animated": false
        },
        "state": "Your custom status text"
      },
      {
        "name": "Visual Studio Code",
        "type": 0,
        "details": "Editing README.md",
        "state": "Workspace: my-project",
        // ... more activity data
      }
    ],
    "discord_status": "online", // online, idle, dnd, offline
    "active_on_discord_web": true,
    "active_on_discord_desktop": false,
    "active_on_discord_mobile": true,
    "listening_to_spotify": true,
    "spotify": {
      "album": "Album Name",
      "album_art_url": "https://i.scdn.co/image/...",
      "artist": "Artist Name",
      "song": "Song Name",
      "track_id": "...",
      "timestamps": { ... }
    }
  },
  "success": true
}
```

## 🎨 How This Project Uses Lanyard

### Features Implemented

1. **Profile Picture**
   - Displays your Discord avatar
   - Updates when you change it on Discord
   - Supports animated avatars

2. **Status Indicator**
   - Shows your Discord status (online, idle, dnd, offline)
   - Color-coded status dots

3. **Custom Status**
   - Displays your custom status text
   - Shows custom status emojis
   - Positioned next to your profile picture

4. **Activity Display**
   - Shows current game or application
   - Displays activity details (state, rich presence)
   - Album art for Spotify listening

5. **Interactive Carousel**
   - Swipeable cards for Discord/Spotify activity
   - Automatic rotation
   - Touch gestures for mobile

### Code Components

#### Discord Status Component (`components/Misc/DiscordStatus.misc.tsx`)

This component handles:
- Fetching Discord status from Lanyard API
- Displaying activities in a swipeable carousel
- Showing Spotify listening status
- Handling user interactions (swipe, drag)

#### Main Page Integration (`pages/index.tsx`)

The main page:
- Fetches your Discord profile information
- Displays avatar, status, and custom status
- Integrates Discord status with other features

## 🔧 Advanced Usage

### WebSocket Connection (Real-time Updates)

For real-time updates without polling, you can use the WebSocket:

```typescript
import { useLanyard } from "react-use-lanyard";

function App() {
  const { loading, status } = useLanyard({
    userId: "YOUR_DISCORD_USER_ID",
    socket: true,
  });

  if (loading) return <div>Loading...</div>;
  return <pre>{JSON.stringify(status, null, 4)}</pre>;
}
```

### Key-Value Storage

Lanyard supports KV pairs for storing additional data:

```typescript
import { set, del } from "react-use-lanyard";

// Set KV pair
await set({
  apiKey: "your_api_key", // Get from .apikey command on Lanyard bot
  userId: "YOUR_DISCORD_USER_ID",
  key: "test_key",
  value: "test value",
});

// Delete KV pair
await del({
  apiKey: "your_api_key",
  userId: "YOUR_DISCORD_USER_ID",
  key: "test_key",
});
```

### Self-Hosted Lanyard API

If you want to host your own Lanyard instance:

1. Clone the Lanyard repository
2. Deploy to your server
3. Update the API URL in your code:
   ```typescript
   const response = await fetch('https://your-lanyard-instance.com/v1/users/YOUR_USER_ID');
   ```

## 🐛 Troubleshooting

### Status Not Showing

**Problem:** Your Discord status isn't appearing on your website.

**Solutions:**
1. Make sure you're not set to "Invisible" on Discord
2. Check that the Lanyard bot is in your server
3. Verify your Discord User ID is correct
4. Check the browser console for API errors
5. Ensure you have an active internet connection

### Avatar Not Loading

**Problem:** Your profile picture isn't displaying.

**Solutions:**
1. Check your Discord privacy settings (allow profile visibility)
2. Make sure your Discord User ID is correct
3. Check if the avatar URL format is correct
4. Verify your internet connection

### Activity Not Showing

**Problem:** Your current activity (game, app) isn't displaying.

**Solutions:**
1. Make sure the activity has "Display as status" enabled in Discord
2. Check if the activity is supported by Discord's Rich Presence
3. Verify the Lanyard API is returning activity data
4. Check the browser console for errors

### Rate Limiting

**Problem:** You're getting rate-limited by the API.

**Solutions:**
1. Reduce polling frequency (currently set to 10 seconds)
2. Use WebSocket connection for real-time updates
3. Implement caching on your server
4. Consider self-hosting Lanyard

## 📚 Additional Resources

- [Lanyard GitHub Repository](https://github.com/Phineas/lanyard)
- [Lanyard Discord Server](https://discord.gg/MPKXhA3ZK7)
- [react-use-lanyard Package](https://www.npmjs.com/package/react-use-lanyard)
- [Discord Rich Presence Documentation](https://discord.com/developers/docs/rich-presence/how-to)

## 🤝 Support

If you encounter issues:
1. Check the [Lanyard Discord Server](https://discord.gg/MPKXhA3ZK7)
2. Create an issue on [GitHub](https://github.com/abyn365/abyndotxyz/issues)
3. Refer to the official Lanyard documentation

## 📝 Credits

- [Lanyard](https://github.com/Phineas/lanyard) by Phineas
- Template based on [personal-bio](https://github.com/lrmn7/personal-bio) by lrmn7
- Integration by [abyn](https://abyn.xyz)

---

**This integration is part of the [abyndotxyz](https://github.com/abyn365/abyndotxyz) personal bio template.**
