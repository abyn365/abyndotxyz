import { NextApiRequest, NextApiResponse } from "next";

const DISCORD_ID = "877018055815868426";

export const statusImages = {
  online: 'https://cdn3.emoji.gg/emojis/1514-online-blank.png',
  idle: 'https://cdn3.emoji.gg/emojis/5204-idle-blank.png',
  dnd: 'https://cdn3.emoji.gg/emojis/4431-dnd-blank.png',
  offline: 'https://cdn3.emoji.gg/emojis/6610-invisible-offline-blank.png'
};

export const getStatusImage = (status: string, isActive: boolean) => {
  if (!isActive) return statusImages.offline;
  return statusImages[status as keyof typeof statusImages] || statusImages.offline;
};

export const getActiveDevice = (data: any) => {
  if (data.active_on_discord_desktop) return 'Desktop';
  if (data.active_on_discord_web) return 'Web';
  if (data.active_on_discord_mobile) return 'Mobile';
  return null;
};

const getImageUrl = (imageUrl: string | undefined) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('mp:external/')) {
    try {
      const url = imageUrl
        .split('/https/')[1]
        ?.replace(/%25/g, '%')
        ?.replace(/\/assets\/\d+\.png$/, '/assets/logo.png');

      if (url) {
        return `https://${url}`;
      }
    } catch (error) {
      console.error('Error processing PreMiD image:', error);
    }
  }

  if (imageUrl.startsWith('spotify:')) {
    const spotifyImageId = imageUrl.replace('spotify:', '');
    return `https://i.scdn.co/image/${spotifyImageId}`;
  }

  return null;
};

const buildSpotifyLink = (trackId?: string) => {
  if (!trackId) return null;
  return `https://open.spotify.com/track/${trackId}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ error: 'Failed to fetch Discord status' });
    }

    const device = getActiveDevice(data.data);
    const isActive = Boolean(device);

    const activity = data.data.activities?.find((a: any) =>
      (a.type === 0 || a.type === 3) && a.name !== 'Spotify'
    );

    const spotify = data.data.spotify
      ? {
          album: data.data.spotify.album,
          albumArtUrl: data.data.spotify.album_art_url,
          artist: data.data.spotify.artist,
          song: data.data.spotify.song,
          timestamps: data.data.spotify.timestamps || null,
          trackId: data.data.spotify.track_id || null,
          songUrl: buildSpotifyLink(data.data.spotify.track_id),
        }
      : null;

    return res.status(200).json({
      isActive: Boolean(activity),
      status: data.data.discord_status,
      activeDevice: device,
      isOnline: isActive,
      activity: activity ? {
        name: activity.name,
        details: activity.details,
        state: activity.state,
        image: getImageUrl(activity.assets?.large_image),
        smallImage: getImageUrl(activity.assets?.small_image),
        largeText: activity.assets?.large_text,
        smallText: activity.assets?.small_text,
        timestamps: activity.timestamps || null,
      } : null,
      spotify,
    });
  } catch (error) {
    console.error('Discord status error:', error);
    return res.status(500).json({ error: 'Failed to fetch Discord status' });
  }
}
