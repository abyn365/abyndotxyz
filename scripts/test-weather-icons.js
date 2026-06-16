// Simple script to test weather -> icon mapping (run with `node scripts/test-weather-icons.js`)
const getWeatherIconName = (code, isNight) => {
  if (code >= 200 && code < 300) return 'CloudLightning';
  if (code >= 300 && code < 400) return 'CloudRain';
  if (code >= 500 && code < 600) return 'CloudRain';
  if (code >= 600 && code < 700) return 'CloudSnow';
  if (code >= 700 && code < 800) return 'Cloud';
  if (code === 800) return isNight ? 'Moon' : 'Sun';
  if (code > 800 && code < 900) return 'Cloud';
  return 'Cloud';
};

const codes = [200, 300, 500, 600, 700, 800, 801, 900];

console.log('Testing weather icon mapping for various codes (isNight = false, true):\n');
for (const code of codes) {
  const day = getWeatherIconName(code, false);
  const night = getWeatherIconName(code, true);
  console.log(`code ${code}: day -> ${day}, night -> ${night}`);
}

console.log('\nSample realistic payload check:\n');
const sample = {
  time: '2026-06-16T17:45',
  temperature: 26,
  feelsLike: 30,
  weatherCode: 800,
  weatherDescription: 'Clear sky',
  isDay: false,
};
const icon = getWeatherIconName(sample.weatherCode, !sample.isDay);
console.log(`payload isDay=${sample.isDay} -> icon ${icon}`);
