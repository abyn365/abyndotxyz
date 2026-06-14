import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

const CACHE_TTL = 60 * 60; // 1 hour in seconds

const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return weatherCodes[code] || 'Unknown';
};

type WeatherData = {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cacheKey = 'weather-yogyakarta';

  // ---------- KV CACHE HIT ----------
  try {
    const cached = await kv.get<WeatherData>(cacheKey);
    if (cached) {
      res.setHeader('x-cache', 'KV_HIT');
      return res.status(200).json(cached);
    }
  } catch (err) {
    console.warn('KV cache read failed, proceeding without cache:', err);
  }

  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-7.7956&longitude=110.3695&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=Asia/Jakarta'
    );
    const data = await response.json();

    if (!data.current) {
      return res.status(502).json({ error: 'Weather API returned no data' });
    }

    const weather: WeatherData = {
      time: data.current.time,
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      weatherDescription: getWeatherDescription(data.current.weather_code),
    };

    // ---------- STORE IN KV ----------
    try {
      await kv.set(cacheKey, weather, { ex: CACHE_TTL });
    } catch (err) {
      console.warn('KV cache write failed:', err);
    }

    res.setHeader('x-cache', 'KV_MISS');
    return res.status(200).json(weather);
  } catch (error) {
    console.error('Weather fetch failed:', error);

    // ---------- STALE FALLBACK ----------
    try {
      const cached = await kv.get<WeatherData>(cacheKey);
      if (cached) {
        res.setHeader('x-cache', 'KV_STALE');
        return res.status(200).json(cached);
      }
    } catch (err) {
      console.warn('KV stale fallback failed:', err);
    }

    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}