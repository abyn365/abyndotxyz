import { NextApiRequest, NextApiResponse } from 'next';

const DISCORD_ID = "877018055815868426";

const getImageUrl = (activity: any) => {
  if (!activity) return null;
  
  // Handle Spotify activity
  if (activity.name === 'Spotify' && activity.assets?.large_image) {
    // Extract Spotify image ID from "spotify:ab67616d0000b27300830d09f77f976a7c3516d2"
    const spotifyImageId = activity.assets.large_image.replace('spotify:', '');
    return `https://i.scdn.co/image/${spotifyImageId}`;
  }
  
  // Handle PreMiD format
  if (activity.assets?.large_image?.startsWith('mp:external/')) {
    try {
      const match = activity.assets.large_image.match(/PreMiD\/websites\/([^/]+\/[^/]+)/);
      if (match) {
        const servicePath = decodeURIComponent(match[1]);
        return `https://cdn.rcd.gg/PreMiD/websites/${servicePath}/assets/logo.png`;
      }
    } catch (error) {
      console.error('Error processing PreMiD image:', error);
    }
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

    const activity = data.data.activities?.find((a: any) => a.type === 0 || a.type === 2);
    
    if (!activity) {
      return res.status(200).json({
        isActive: false,
        status: data.data.discord_status,
        message: 'Not doing anything'
      });
    }

    const imageUrl = getImageUrl(activity);

    return res.status(200).json({
      isActive: true,
      status: data.data.discord_status,
      activity: {
        name: activity.name,
        details: activity.details,
        state: activity.state,
        image: imageUrl
      }
    });

  } catch (error) {
    console.error('Discord status error:', error);
    return res.status(500).json({ error: 'Failed to fetch Discord status' });
  }
}