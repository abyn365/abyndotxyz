import { NextApiRequest, NextApiResponse } from "next";

const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

// Prefer a server-side env var for the token.
// For self-hosted Umami, obtain this via POST /api/auth/login.
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
    if (!WEBSITE_ID || !UMAMI_AUTH_TOKEN) {
      throw new Error("Missing Umami ENV variables");
    }

    // Do not mutate the same date object.
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
    let activeData: any = { x: 0 };
    try {
      const activeResponse = await fetchUmami(
        `https://api.umami.is/websites/${WEBSITE_ID}/active`
      );

      if (activeResponse.ok) {
        activeData = await activeResponse.json();
      } else {
        console.warn("Umami active endpoint failed:", activeResponse.status);
      }
    } catch (error) {
      console.warn("Failed to fetch active visitors:", error);
    }

    // =================== STATS ===================
    let statsData: any = {};
    try {
      const statsResponse = await fetchUmami(
        `https://api.umami.is/v1/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`
      );

      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      } else {
        console.warn("Umami stats endpoint failed:", statsResponse.status);
      }
    } catch (error) {
      console.warn("Failed to fetch stats:", error);
    }

    // Works for both API formats
    const pageviews =
      typeof statsData?.pageviews === "number"
        ? statsData.pageviews
        : Array.isArray(statsData?.pageviews)
        ? statsData.pageviews.reduce((total: number, item: any) => total + (item?.y ?? 0), 0)
        : statsData?.pageviews?.value ??
          statsData?.pageviews ??
          0;

    const uniques =
      typeof statsData?.visitors === "number"
        ? statsData.visitors
        : statsData?.visitors?.value ??
          statsData?.uniques ??
          statsData?.visitors ??
          0;

    const active =
      activeData?.visitors ??
      activeData?.active ??
      activeData?.x ??
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
