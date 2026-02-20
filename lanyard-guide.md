# Lanyard Integration Guide

This guide explains how to use Lanyard to display your Discord status and activities on your website.

## What is Lanyard?

Lanyard is an API that retrieves your Discord presence data in real-time. It provides your Discord status, custom status with emojis, and current activities (like Spotify, games, etc.).

## Getting Your Discord User ID

1. Open Discord
2. Enable Developer Mode (User Settings > Advanced > Developer Mode)
3. Right-click on your username
4. Click "Copy User ID"

## Using Lanyard in This Project

This template uses the Lanyard API to display your Discord status. The integration is already set up in the components.

### API Endpoint

You can directly fetch your Discord status using:

```
GET https://api.lanyard.rest/v1/users/{your_user_id}
```

### Example Response

```json
{
  "data": {
    "discord_user": {
      "id": "877018055815868426",
      "username": "yourusername",
      "avatar": "avatar_hash",
      "discriminator": "0",
      "global_name": "Your Display Name"
    },
    "discord_status": "online",
    "activities": [
      {
        "id": "custom",
        "name": "Custom Status",
        "type": 4,
        "emoji": {
          "name": "💻",
          "id": null
        },
        "state": "Working on a project",
        "created_at": 1744417034965
      }
    ],
    "spotify": {
      "song": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "album_art_url": "https://example.com/album-art.jpg",
      "timestamps": {
        "start": 1744419407133,
        "end": 1744419595597
      },
      "track_id": "spotify_track_id"
    },
    "active_on_discord_mobile": true,
    "active_on_discord_web": true,
    "active_on_discord_desktop": true
  },
  "success": true
}
```

## Displayed Information

The template shows:

- **Discord Status** - online, idle, dnd, or offline
- **Custom Status** - Your custom status message with emoji
- **Current Activity** - Games, apps, or other activities
- **Spotify** - Currently playing song (if listening to Spotify)

## Customizing

### Changing the User ID

Update the Discord user ID in the relevant component:

```typescript
const DISCORD_USER_ID = 'your_user_id';
```

### Styling

The Discord status components use Tailwind CSS. You can customize the appearance by editing the component files in `components/`.

## KV Support (Advanced)

If you want to store custom key-value data with Lanyard:

1. Get your API key from the Lanyard Discord bot using `/apikey`
2. Use the KV methods:

```typescript
import { set, del } from 'react-use-lanyard';

// Store a value
await set({
  apiKey: 'your_api_key',
  userId: 'your_user_id',
  key: 'your_key',
  value: 'your_value'
});

// Delete a value
await del({
  apiKey: 'your_api_key',
  userId: 'your_user_id',
  key: 'your_key'
});
```

## Resources

- [Lanyard GitHub](https://github.com/phyral/lanyard)
- [Lanyard Discord](https://discord.gg/lanyard)
- [react-use-lanyard Package](https://www.npmjs.com/package/react-use-lanyard)
