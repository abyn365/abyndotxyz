import { useEffect, useState, useRef } from 'react';
import {
  FiClock,
  FiCloud,
  FiCloudRain,
  FiCloudLightning,
  FiCloudSnow,
  FiSun,
  FiMoon,
} from 'react-icons/fi';

type WeatherData = {
  time: string;
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
};

const getWeatherIcon = (code: number, isNight: boolean) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code >= 200 && code < 300) return FiCloudLightning; // Thunderstorm
  if (code >= 300 && code < 400) return FiCloudRain; // Drizzle
  if (code >= 500 && code < 600) return FiCloudRain; // Rain
  if (code >= 600 && code < 700) return FiCloudSnow; // Snow
  if (code >= 700 && code < 800) return FiCloud; // Atmosphere (fog, mist, etc.)
  if (code === 800) return isNight ? FiMoon : FiSun; // Clear sky
  if (code > 800 && code < 900) return FiCloud; // Mostly cloudy
  return FiCloud; // Fallback
};

const TimeWeather = () => {
  const timeRef = useRef<HTMLSpanElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNight, setIsNight] = useState(false);
  const [isAwake, setIsAwake] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

      // Update day/night and awake status for Yogyakarta (GMT+7)
      const hour = gmt7Time.getHours() + gmt7Time.getMinutes() / 60;
      setIsNight(hour >= 18 || hour < 6);
      setIsAwake(hour >= 6 && hour < 22.5);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch weather for Yogyakarta via cached API route
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        const data = await response.json();

        if (data && data.temperature !== undefined) {
          setWeather(data);
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

  const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode, isNight) : FiCloud;
  const TimeIcon = isNight ? FiMoon : FiSun;

  if (!mounted) {
    return (
      <div className="text-sm text-[var(--text-secondary)] space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
          <FiClock className="h-3.5 w-3.5" />
          <span ref={timeRef}></span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-[var(--text-secondary)] space-y-1">
      <div className="group relative flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
        <TimeIcon className={`h-3.5 w-3.5 ${!isNight ? 'text-amber-400 animate-spin-slow' : 'text-indigo-300'}`} />
        <span ref={timeRef}></span>

        {/* Premium glassmorphic tooltip */}
        <div className="absolute bottom-full left-0 mb-2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none origin-bottom-left">
          <div className="whitespace-nowrap rounded-xl px-4 py-2.5 text-xs border shadow-lg backdrop-blur-xl"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {isAwake ? (
              <span className="font-medium text-[var(--text-primary)]">
                  I'm {isAwake ? "probably awake right now." : "probably asleep right now... 😴"}
              </span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-3 top-full -mt-px"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--card-border)',
            }}
          />
        </div>
      </div>
      {!loading && weather && (
        <div className="flex items-center gap-1.5">
          <WeatherIcon className={`h-3.5 w-3.5 ${weather.weatherCode === 800 && !isNight ? 'text-amber-400' : ''}`} />
          <p>
            It's <span className="font-semibold text-[var(--text-primary)]">{weather.temperature}°C</span> with{' '}
            <span className="text-[var(--text-secondary)]">{weather.weatherDescription.toLowerCase()}</span> in{' '}
            <span className="font-semibold text-[var(--text-primary)]">Yogyakarta</span>.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeWeather;
