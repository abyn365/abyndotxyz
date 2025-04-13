import { NextApiRequest, NextApiResponse } from 'next';

const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const API_KEY = process.env.NEXT_PUBLIC_UMAMI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active visitors
    const activeResponse = await fetch(`https://api.umami.is/v1/websites/${WEBSITE_ID}/active`, {
      headers: {
        'Accept': 'application/json',
        'x-umami-api-key': API_KEY || ''
      }
    });

    if (!activeResponse.ok) {
      throw new Error('Failed to fetch active visitors');
    }
    const activeData = await activeResponse.json();

    // Get stats for today
    const today = new Date();
    const startAt = new Date(today.setHours(0,0,0,0)).getTime();
    const endAt = new Date(today.setHours(23,59,59,999)).getTime();

    const statsResponse = await fetch(
      `https://api.umami.is/v1/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`, {
        headers: {
          'Accept': 'application/json',
          'x-umami-api-key': API_KEY || ''
        }
      }
    );

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch stats');
    }
    const statsData = await statsResponse.json();

    return res.status(200).json({
      active: activeData.visitors || 0, // Updated to use visitors instead of x
      pageviews: statsData.pageviews?.value || 0,
      uniques: statsData.visitors?.value || 0
    });

  } catch (error) {
    console.error('Failed to fetch visitor stats:', error);
    return res.status(200).json({
      active: 0,
      pageviews: 0,
      uniques: 0
    });
  }
}