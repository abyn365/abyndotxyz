import { NextApiRequest, NextApiResponse } from "next";

const BASE_URL = process.env.UMAMI_BASE_URL; // e.g. https://analytics.yourdomain.com
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;
const UMAMI_AUTH_TOKEN = process.env.UMAMI_AUTH_TOKEN;

async function fetchUmami(url: string) {
  if (!UMAMI_AUTH_TOKEN) {
    throw new Error("Missing Umami auth token");
  }

  return fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${UMAMI_AUTH_TOKEN}`,
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!BASE_URL || !WEBSITE_ID || !UMAMI_AUTH_TOKEN) {
      throw new Error("Missing Umami ENV variables");
    }

    const now = new Date();
    const startAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    ).getTime();

    const endAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23, 59, 59, 999
    ).getTime();

    const [activeResponse, statsResponse] = await Promise.all([
      fetchUmami(`${BASE_URL}/api/websites/${WEBSITE_ID}/active`),
      fetchUmami(`${BASE_URL}/api/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`),
    ]);

    let activeData: { visitors?: number } = {};
    let statsData: { pageviews?: number; visitors?: number } = {};

    if (activeResponse.ok) {
      activeData = await activeResponse.json();
    } else {
      const text = await activeResponse.text();
      console.warn("Umami active endpoint failed:", activeResponse.status, text);
    }

    if (statsResponse.ok) {
      statsData = await statsResponse.json();
    } else {
      const text = await statsResponse.text();
      console.warn("Umami stats endpoint failed:", statsResponse.status, text);
    }

    return res.status(200).json({
      active: activeData.visitors ?? 0,
      pageviews: statsData.pageviews ?? 0,
      uniques: statsData.visitors ?? 0,
    });
  } catch (error) {
    console.error("Visitor API Error:", error);

    return res.status(200).json({
      active: 0,
      pageviews: 0,
      uniques: 0,
    });
  }
}
