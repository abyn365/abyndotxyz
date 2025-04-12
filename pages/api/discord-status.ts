import { NextApiRequest, NextApiResponse } from 'next';

const DISCORD_ID = "877018055815868426";

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

    // Look for any activity (type 0 for game, 2 for Spotify, 3 for streaming)
    const activity = data.data.activities?.find((a: any) => 
      a.type === 0 || a.type === 2 || a.type === 3
    );
    
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