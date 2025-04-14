import { NextApiRequest, NextApiResponse } from 'next';

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
  // Priority order: desktop > web > mobile
  if (data.active_on_discord_desktop) return 'Desktop';
  if (data.active_on_discord_web) return 'Web';
  if (data.active_on_discord_mobile) return 'Mobile';
  return null;
};

const getImageUrl = (activity: any) => {
  if (!activity) return null;
  
  // Handle PreMiD format
  if (activity.assets?.large_image?.startsWith('mp:external/')) {
    try {
      // Extract image URL from PreMiD format and fix URL encoding
      const imageUrl = activity.assets.large_image
        .split('/https/')[1]
        ?.replace(/%25/g, '%')  // Fix double encoding
        ?.replace(/\/assets\/\d+\.png$/, '/assets/logo.png'); // Replace numbered assets with logo.png
      
      if (imageUrl) {
        return `https://${imageUrl}`;
      }
    } catch (error) {
      console.error('Error processing PreMiD image:', error);
    }
  }
  
  // Handle Spotify
  if (activity.name === 'Spotify' && activity.assets?.large_image) {
    const spotifyImageId = activity.assets.large_image.replace('spotify:', '');
    return `https://i.scdn.co/image/${spotifyImageId}`;
  }
  
  return null;
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

    // Check active status with priority
    const device = getActiveDevice(data.data);
    const isActive = Boolean(device);

    // Find activity that is not Spotify
    const activity = data.data.activities?.find((a: any) => 
      (a.type === 0 || a.type === 3) && a.name !== 'Spotify'
    );
    
    return res.status(200).json({
      isActive: Boolean(activity),
      status: data.data.discord_status,
      activeDevice: device,
      isOnline: isActive,
      activity: activity ? {
        name: activity.name,
        details: activity.details,
        state: activity.state,
        image: getImageUrl(activity)
      } : null
    });

  } catch (error) {
    console.error('Discord status error:', error);
    return res.status(500).json({ error: 'Failed to fetch Discord status' });
  }
}