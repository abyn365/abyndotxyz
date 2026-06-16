import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Sun,
  Moon,
} from 'lucide-react';

type WeatherData = {
  time: string;
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
};

const getWeatherIcon = (code: number, isNight: boolean) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code >= 200 && code < 300) return CloudLightning;
  if (code >= 300 && code < 400) return CloudRain;
  if (code >= 500 && code < 600) return CloudRain;
  if (code >= 600 && code < 700) return CloudSnow;
  if (code >= 700 && code < 800) return Cloud;
  if (code === 800) return isNight ? Moon : Sun;
  if (code > 800 && code < 900) return Cloud;
  return Cloud;
};

const TimeWeather = () => {
  const timeRef = useRef<HTMLSpanElement>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeIsNight, setTimeIsNight] = useState(false);
  const [isAwake, setIsAwake] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const gmt7Time = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
      );

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

      const hour = gmt7Time.getHours() + gmt7Time.getMinutes() / 60;
      setTimeIsNight(hour >= 18 || hour < 6);
      setIsAwake(hour >= 6 && hour < 22.5);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather');
        const data = await response.json();

        if (data && data.temperature !== undefined) {
          setWeather(data);
          // Keep `timeIsNight` separately; prefer API `isDay` when rendering below
          // but don't overwrite the client's local time state here to avoid
          // rapid flipping while time updates run. We derive the effective
          // `isNight` at render time using the fetched `weather` when present.
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000);
    return () => clearInterval(weatherInterval);
  }, []);

  // prefer API value when available, otherwise fall back to client's time
  const isNight = weather ? !weather.isDay : timeIsNight;
  const WeatherIcon = weather ? getWeatherIcon(weather.weatherCode, isNight) : Cloud;
  const TimeIcon = isNight ? Moon : Sun;

  if (!mounted) {
    return (
      <div className="text-sm text-[var(--text-secondary)] space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
          <Clock className="h-3.5 w-3.5" />
          <span ref={timeRef}></span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-[var(--text-secondary)] space-y-1">
      <div className="group relative flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
        <TimeIcon
          data-testid="time-icon"
          className={`h-3.5 w-3.5 ${
            !isNight ? 'text-amber-400 animate-spin-slow' : 'text-indigo-300'
          }`}
        />
        <span ref={timeRef}></span>

        <div className="absolute bottom-full left-0 mb-2 z-50 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none origin-bottom-left">
          <div
            className="whitespace-nowrap rounded-xl px-4 py-2.5 text-xs border shadow-lg backdrop-blur-xl"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <span className="font-medium text-[var(--text-primary)]">
              I&apos;m {isAwake ? 'probably awake right now.' : 'probably asleep right now... 😴'}
            </span>
          </div>

          <div
            className="absolute left-3 top-full -mt-px"
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
          <motion.div
            className="inline-flex"
            animate={weather.weatherCode === 800 ? { rotate: [0, 4, 0, -4, 0] } : { y: [0, -1, 0, 1, 0] }}
            transition={{
              duration: weather.weatherCode === 800 ? 4 : 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <WeatherIcon
              data-testid="weather-icon"
              className={`h-3.5 w-3.5 ${
                weather.weatherCode === 800 && weather.isDay ? 'text-amber-400' : ''
              }`}
            />
          </motion.div>
          <p>
            It&apos;s{' '}
            <span className="relative inline-flex items-center group">
              <span className="font-semibold text-[var(--text-primary)]">
                {weather.temperature}°C
              </span>
              <span className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs text-[var(--text-secondary)] shadow-lg backdrop-blur-xl group-hover:block">
                Feels like {weather.feelsLike}°C
              </span>
              <span
                className="absolute left-1/2 top-full hidden -translate-x-1/2 -mt-px border-l-6 border-r-6 border-t-6 border-transparent border-t-[var(--card-border)] group-hover:block"
              />
            </span>{' '}
            with{' '}
            <span className="text-[var(--text-secondary)]">
              {weather.weatherDescription.toLowerCase()}
            </span>{' '}
            in{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              Yogyakarta
            </span>
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeWeather;
