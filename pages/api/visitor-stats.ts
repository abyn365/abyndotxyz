import { NextApiRequest, NextApiResponse } from "next";

const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const API_KEY = process.env.NEXT_PUBLIC_UMAMI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!WEBSITE_ID || !API_KEY) {
      throw new Error("Missing Umami ENV variables");
    }

    // ✅ FIXED: Do NOT mutate the same date object
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

    // =================== ACTIVE USERS ===================
    const activeResponse = await fetch(
      `https://api.umami.is/v1/websites/${WEBSITE_ID}/active`,
      {
        headers: {
          Accept: "application/json",
          "x-umami-api-key": API_KEY,
        },
      }
    );

    if (!activeResponse.ok) {
      throw new Error("Failed to fetch active visitors");
    }

    const activeData = await activeResponse.json();

    // =================== STATS ===================
    const statsResponse = await fetch(
      `https://api.umami.is/v1/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
      {
        headers: {
          Accept: "application/json",
          "x-umami-api-key": API_KEY,
        },
      }
    );

    if (!statsResponse.ok) {
      throw new Error("Failed to fetch stats");
    }

    const statsData = await statsResponse.json();

    // ✅ Works for both API formats
    const pageviews =
      statsData?.pageviews?.value ??
      statsData?.pageviews ??
      0;

    const uniques =
      statsData?.visitors?.value ??
      statsData?.uniques ??
      statsData?.visitors ??
      0;

    const active =
      activeData?.visitors ??
      activeData?.active ??
      0;

    return res.status(200).json({
      active,
      pageviews,
      uniques,
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
