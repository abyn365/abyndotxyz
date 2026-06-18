import { timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  geocodeLocation,
  getCurrentLocation,
  setCurrentLocation,
} from "../../lib/location";

const isAuthorized = (authorization?: string) => {
  const secret = process.env.LOCATION_SECRET;
  if (!secret || !authorization) return false;

  const authBuffer = Buffer.from(authorization);
  const secretBuffer = Buffer.from(secret);

  if (authBuffer.length !== secretBuffer.length) return false;
  return timingSafeEqual(authBuffer, secretBuffer);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return res.status(200).json(await getCurrentLocation());
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { city, country } = req.body || {};
  if (
    typeof city !== "string" ||
    typeof country !== "string" ||
    !city.trim() ||
    !country.trim()
  ) {
    return res.status(400).json({ error: "city and country are required" });
  }

  try {
    const location = await geocodeLocation(city, country);
    await setCurrentLocation(location);
    return res.status(200).json({ message: "Location updated", location });
  } catch (error) {
    console.error("Location update failed:", error);
    return res.status(502).json({ error: "Failed to update location" });
  }
}
