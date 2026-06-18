import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";
import { getCurrentLocation } from "../../lib/location";

const CACHE_TTL = 60 * 10; // 10 minutes in seconds

type CachedValue = {
  weather: WeatherData;
  fetchedAt: number; // epoch seconds
};

const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || "Unknown";
};

type WeatherData = {
  time: string;
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  city: string;
  country: string;
  timezone: string;
  locationUpdatedAt: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const location = await getCurrentLocation();
  const cacheKey =
    `weather-${location.city}-${location.country}-${location.timestamp}`.toLowerCase();

  // ---------- KV CACHE CHECK ----------
  try {
    const cached = await kv.get<CachedValue>(cacheKey);
    if (cached && cached.weather) {
      const now = Math.floor(Date.now() / 1000);
      const age = now - (cached.fetchedAt || 0);

      // still fresh
      if (age < CACHE_TTL) {
        res.setHeader("x-cache", "KV_HIT");
        return res.status(200).json(cached.weather);
      }

      // cache expired -> serve stale immediately and trigger a background refresh
      (async function backgroundRefresh() {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${
              location.latitude
            }&longitude=${
              location.longitude
            }&current=temperature_2m,apparent_temperature,is_day,weather_code&temperature_unit=celsius&timezone=${encodeURIComponent(
              location.timezone
            )}`
          );
          const data = await response.json();

          if (data && data.current) {
            const nowInner = Math.floor(Date.now() / 1000);
            const weather: WeatherData = {
              time: data.current.time,
              temperature: Math.round(data.current.temperature_2m),
              feelsLike: Math.round(data.current.apparent_temperature),
              weatherCode: data.current.weather_code,
              weatherDescription: getWeatherDescription(
                data.current.weather_code
              ),
              isDay: data.current.is_day === 1,
              city: location.city,
              country: location.country,
              timezone: location.timezone,
              locationUpdatedAt: location.timestamp,
            };

            try {
              await kv.set(
                cacheKey,
                { weather, fetchedAt: nowInner },
                { ex: CACHE_TTL }
              );
            } catch (err) {
              console.warn(
                "KV cache write failed during background refresh:",
                err
              );
            }
          }
        } catch (err) {
          console.warn("Background weather refresh failed:", err);
        }
      })();

      res.setHeader("x-cache", "KV_STALE");
      return res.status(200).json(cached.weather);
    }
  } catch (err) {
    console.warn("KV cache read failed, proceeding without cache:", err);
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${
        location.latitude
      }&longitude=${
        location.longitude
      }&current=temperature_2m,apparent_temperature,is_day,weather_code&temperature_unit=celsius&timezone=${encodeURIComponent(
        location.timezone
      )}`
    );
    const data = await response.json();

    if (!data.current) {
      return res.status(502).json({ error: "Weather API returned no data" });
    }

    const weather: WeatherData = {
      time: data.current.time,
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      weatherCode: data.current.weather_code,
      weatherDescription: getWeatherDescription(data.current.weather_code),
      isDay: data.current.is_day === 1,
      city: location.city,
      country: location.country,
      timezone: location.timezone,
      locationUpdatedAt: location.timestamp,
    };

    // ---------- STORE IN KV ----------
    try {
      const now = Math.floor(Date.now() / 1000);
      await kv.set(cacheKey, { weather, fetchedAt: now }, { ex: CACHE_TTL });
    } catch (err) {
      console.warn("KV cache write failed:", err);
    }

    res.setHeader("x-cache", "KV_MISS");
    return res.status(200).json(weather);
  } catch (error) {
    console.error("Weather fetch failed:", error);

    // ---------- STALE FALLBACK ----------
    try {
      const cached = await kv.get<CachedValue>(cacheKey);
      if (cached && cached.weather) {
        res.setHeader("x-cache", "KV_STALE");
        return res.status(200).json(cached.weather);
      }
    } catch (err) {
      console.warn("KV stale fallback failed:", err);
    }

    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
