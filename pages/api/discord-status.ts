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

const isPreMiDText = (text?: string) => typeof text === 'string' && /pre.?mid/i.test(text);

const sanitizeActivityText = (text?: string) => {
  if (!text) return null;
  return isPreMiDText(text) ? null : text;
};

const resolveDiscordAsset = (applicationId?: string, asset?: string) => {
  if (!asset) {
    if (applicationId) {
      return `https://dcdn.dstn.to/app-icons/${applicationId}.webp?size=512`;
    }
    return null;
  }

  if (asset.startsWith('http://') || asset.startsWith('https://')) {
    return asset;
  }

  const parts = asset.split(':');

  if (parts.length > 1) {
    switch (parts[0]) {
      case 'spotify': {
        const spotifyImageId = parts[1];
        return spotifyImageId ? `https://i.scdn.co/image/${spotifyImageId}` : null;
      }
      case 'mp': {
        const path = parts.slice(1).join(':');
        return `https://media.discordapp.net/${path}`;
      }
      case 'twitch': {
        return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${parts[1]}.png`;
      }
      case 'youtube': {
        return `https://i.ytimg.com/vi/${parts[1]}/hqdefault_live.jpg`;
      }
      default:
        return null;
    }
  }

  if (applicationId) {
    return `https://cdn.discordapp.com/app-assets/${applicationId}/${asset}.webp?size=512`;
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

    const activities = Array.isArray(data.data.activities) ? data.data.activities : [];
    const activityCandidates = activities.filter(
      (a: any) =>
        [0, 2, 3].includes(a.type) &&
        a.name !== 'Spotify' &&
        !isPreMiDText(a.name)
    );

    const activity =
      activityCandidates.find(
        (a: any) =>
          !isPreMiDText(a.assets?.large_text) &&
          !isPreMiDText(a.assets?.small_text)
      ) || activityCandidates[0] || null;

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
      activity: activity
        ? {
            name: activity.name,
            type: activity.type,
            details: sanitizeActivityText(activity.details),
            state: sanitizeActivityText(activity.state),
            image: resolveDiscordAsset(activity.application_id, activity.assets?.large_image),
            smallImage: activity.assets?.small_image
              ? resolveDiscordAsset(activity.application_id, activity.assets?.small_image)
              : null,
            largeText: sanitizeActivityText(activity.assets?.large_text),
            smallText: sanitizeActivityText(activity.assets?.small_text),
            timestamps: activity.timestamps || null,
          }
        : null,
      spotify,
    });
  } catch (error) {
    console.error('Discord status error:', error);
    return res.status(500).json({ error: 'Failed to fetch Discord status' });
  }
}
