import { NextApiRequest, NextApiResponse } from "next";
import { kv } from "../../lib/kv";
import { getCurrentLocation } from "../../lib/location";

const CACHE_TTL_SECONDS = 60 * 10; // 10 minutes
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

type Location = Awaited<ReturnType<typeof getCurrentLocation>>;

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  is_day: number;
  weather_code: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
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

const WEATHER_DESCRIPTIONS: Record<number, string> = {
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

const getWeatherDescription = (code: number): string => {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown";
};

const buildForecastUrl = (location: Location) => {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,is_day,weather_code"
  );
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("timezone", location.timezone);
  return url.toString();
};

const createWeatherData = (
  current: OpenMeteoCurrent,
  location: Location
): WeatherData => {
  return {
    time: current.time,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    weatherCode: current.weather_code,
    weatherDescription: getWeatherDescription(current.weather_code),
    isDay: current.is_day === 1,
    city: location.city,
    country: location.country,
    timezone: location.timezone,
    locationUpdatedAt: location.timestamp,
  };
};

const fetchWeather = async (location: Location): Promise<WeatherData> => {
  const response = await fetch(buildForecastUrl(location));

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  if (!data.current) {
    throw new Error("Weather API returned no current data");
  }

  return createWeatherData(data.current, location);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const location = await getCurrentLocation();
    const cacheKey = `weather:${location.latitude}:${location.longitude}:${location.timezone}`.toLowerCase();

    const cached = await kv.get<WeatherData>(cacheKey);
    if (cached) {
      res.setHeader("x-cache", "KV_HIT");
      return res.status(200).json(cached);
    }

    const weather = await fetchWeather(location);

    try {
      await kv.set(cacheKey, weather, { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      console.warn("KV cache write failed:", err);
    }

    res.setHeader("x-cache", "KV_MISS");
    return res.status(200).json(weather);
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
