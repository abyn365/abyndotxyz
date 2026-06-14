import { useEffect, useState, useRef } from 'react';

type WeatherData = {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
};

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

const TimeWeather = () => {
  const timeRef = useRef<HTMLParagraphElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Direct DOM writing via ref for zero re-render overhead
    const updateTime = () => {
      const now = new Date();
      const gmt7Time = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      const timeStr = gmt7Time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = gmt7Time.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (timeRef.current) {
        timeRef.current.textContent = `${dateStr} · ${timeStr} GMT+7`;
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch weather for Yogyakarta
    const fetchWeather = async () => {
      try {
        // Yogyakarta coordinates: -7.7956, 110.3695
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-7.7956&longitude=110.3695&current=temperature_2m,weather_code&temperature_unit=celcius&timezone=Asia/Jakarta'
        );
        const data = await response.json();

        if (data.current) {
          setWeather({
            time: data.current.time,
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            weatherDescription: getWeatherDescription(data.current.weather_code),
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000); // Update every 10 minutes
    return () => clearInterval(weatherInterval);
  }, []);

  return (
    <div className="text-sm text-[var(--text-secondary)]">
      <p ref={timeRef} className="font-medium text-[var(--text-primary)]"></p>
      {!loading && weather && (
        <p className="mt-1">
          It's <span className="font-semibold text-[var(--text-primary)]">{weather.temperature}°F</span> with{' '}
          <span className="text-[var(--text-secondary)]">{weather.weatherDescription.toLowerCase()}</span> in{' '}
          <span className="font-semibold text-[var(--text-primary)]">Yogyakarta</span>.
        </p>
      )}
    </div>
  );
};

export default TimeWeather;
