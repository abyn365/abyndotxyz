import { useEffect, useRef, useState } from "react";
import { usePerformanceSaver } from "../hooks/usePerformanceSaver";

// Default state for Weather FX if no user preference is saved (true/false)
const DEFAULT_WEATHER_ENABLED = false;

type WeatherType = "clear-day" | "clear-night" | "fog" | "rain" | "storm" | "snow";

export default function WeatherOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [weatherType, setWeatherType] = useState<WeatherType | null>(null);
  const [isDay, setIsDay] = useState(true);
  const [isEnabled, setIsEnabled] = useState(DEFAULT_WEATHER_ENABLED);
  const { shouldDisableCanvas } = usePerformanceSaver();

  // 1. Sync toggle state with localStorage and window event
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedStr = localStorage.getItem("site-weather-overlay");
    const saved = savedStr !== null ? savedStr === "true" : DEFAULT_WEATHER_ENABLED;
    setIsEnabled(saved);

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsEnabled(customEvent.detail === true);
    };

    window.addEventListener("site-weather-overlay-change", handleToggle);
    return () => window.removeEventListener("site-weather-overlay-change", handleToggle);
  }, []);

  // 2. Fetch live weather data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        setIsDay(data.isDay !== false);
        const code = data.weatherCode ?? 0;

        if (code >= 95 && code <= 99) {
          setWeatherType("storm");
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
          setWeatherType("rain");
        } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
          setWeatherType("snow");
        } else if (code === 45 || code === 48) {
          setWeatherType("fog");
        } else {
          setWeatherType(data.isDay ? "clear-day" : "clear-night");
        }
      } catch (err) {
        // Fallback based on local system time
        const hour = new Date().getHours();
        const fallbackDay = hour >= 6 && hour < 18;
        setIsDay(fallbackDay);
        setWeatherType(fallbackDay ? "clear-day" : "clear-night");
      }
    };

    fetchWeather();
  }, []);

  // 3. Canvas rendering loop
  useEffect(() => {
    if (!isEnabled || shouldDisableCanvas || !weatherType) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle definitions
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      angle?: number;
      spinSpeed?: number;
      wobble?: number;
      wobbleSpeed?: number;
    }

    interface LightBeam {
      x1: number;
      x2: number;
      width1: number;
      width2: number;
      opacity: number;
      targetOpacity: number;
      speed: number;
    }

    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      active: boolean;
    }

    interface RainSplash {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      maxRadius: number;
    }

    const particles: Particle[] = [];
    let lightBeams: LightBeam[] = [];
    const splashes: RainSplash[] = [];
    let shootingStar: ShootingStar = { x: 0, y: 0, length: 0, speed: 0, opacity: 0, active: false };
    let flashOpacity = 0;
    let flashTimer = 0;
    let auroraPhase = 0;

    // Initialize particles depending on weather
    const initParticles = () => {
      particles.length = 0;

      if (weatherType === "rain") {
        const count = Math.min(100, Math.floor(width / 12));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.2 - Math.random() * 0.3,
            vy: 9 + Math.random() * 5,
            size: 1 + Math.random() * 1.2,
            alpha: 0.08 + Math.random() * 0.12,
          });
        }
      } else if (weatherType === "storm") {
        const count = Math.min(160, Math.floor(width / 8));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -3 - Math.random() * 2, // wind tilt
            vy: 15 + Math.random() * 8,
            size: 1.2 + Math.random() * 1.5,
            alpha: 0.12 + Math.random() * 0.18,
          });
        }
      } else if (weatherType === "snow") {
        const count = Math.min(65, Math.floor(width / 18));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.3 + Math.random() * 0.6,
            vy: 0.6 + Math.random() * 1.0,
            size: 2.0 + Math.random() * 3.5, // slightly larger fluffy spheres
            alpha: 0.15 + Math.random() * 0.35,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.008 + Math.random() * 0.012,
          });
        }
      } else if (weatherType === "fog") {
        const count = 7;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0.05 + Math.random() * 0.08,
            vy: (Math.random() - 0.5) * 0.015,
            size: 160 + Math.random() * 140,
            alpha: 0.015 + Math.random() * 0.02,
          });
        }
      } else if (weatherType === "clear-day") {
        // Gently falling and spinning pink sakura blossom petals
        const count = Math.min(32, Math.floor(width / 35));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: -0.4 - Math.random() * 0.8, // drift left
            vy: 0.8 + Math.random() * 1.2, // fall down
            size: 4 + Math.random() * 3, // petal radius
            alpha: 0.15 + Math.random() * 0.25,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.03, // rotation speed
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.01 + Math.random() * 0.015, // float sway
          });
        }

        // Initialize warm god rays
        lightBeams = [
          { x1: width * 0.15, x2: width * 0.3, width1: 90, width2: 200, opacity: 0, targetOpacity: 0.04 + Math.random() * 0.04, speed: 0.004 },
          { x1: width * 0.55, x2: width * 0.65, width1: 110, width2: 240, opacity: 0, targetOpacity: 0.04 + Math.random() * 0.04, speed: 0.003 },
        ];
      } else if (weatherType === "clear-night") {
        // Star map constellation points
        const count = Math.min(45, Math.floor(width / 28));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.85, // keep mostly in upper 85%
            vx: 0,
            vy: 0,
            size: 0.8 + Math.random() * 1.0,
            alpha: Math.random(),
            wobbleSpeed: 0.008 + Math.random() * 0.02, // twinkle rate
          });
        }
      }
    };

    initParticles();

    // Render loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // ── TYPE: STORM (Lightning double flash) ──
      if (weatherType === "storm") {
        flashTimer++;
        if (flashTimer > 280 + Math.random() * 500) {
          flashOpacity = 0.28 + Math.random() * 0.15;
          flashTimer = 0;
        }

        if (flashOpacity > 0) {
          ctx.fillStyle = `rgba(224, 231, 255, ${flashOpacity})`;
          ctx.fillRect(0, 0, width, height);
          flashOpacity *= 0.86; // decay
          if (flashOpacity < 0.01) flashOpacity = 0;
        }
      }

      // ── TYPE: CLEAR DAY (God rays) ──
      if (weatherType === "clear-day" && lightBeams.length > 0) {
        lightBeams.forEach((beam) => {
          if (Math.abs(beam.opacity - beam.targetOpacity) < 0.001) {
            beam.targetOpacity = Math.random() * 0.07;
          } else {
            beam.opacity += (beam.targetOpacity - beam.opacity) * beam.speed;
          }

          const grad = ctx.createLinearGradient(beam.x1, 0, beam.x2, height);
          grad.addColorStop(0, `rgba(253, 224, 71, ${beam.opacity})`);
          grad.addColorStop(0.5, `rgba(253, 224, 71, ${beam.opacity * 0.3})`);
          grad.addColorStop(1, "rgba(253, 224, 71, 0)");

          ctx.beginPath();
          ctx.moveTo(beam.x1 - beam.width1 / 2, 0);
          ctx.lineTo(beam.x1 + beam.width1 / 2, 0);
          ctx.lineTo(beam.x2 + beam.width2 / 2, height);
          ctx.lineTo(beam.x2 - beam.width2 / 2, height);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();

          beam.x1 += 0.04;
          beam.x2 += 0.06;
          if (beam.x1 - beam.width1 > width) beam.x1 = -beam.width1;
          if (beam.x2 - beam.width2 > width) beam.x2 = -beam.width2;
        });
      }

      // ── TYPE: CLEAR NIGHT (Aurora Borealis & Constellations) ──
      if (weatherType === "clear-night") {
        // 1. Draw Waving Aurora
        auroraPhase += 0.0018;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= width; x += 15) {
          const y = 30 + Math.sin(x * 0.002 + auroraPhase) * 35 + Math.cos(x * 0.0012 - auroraPhase * 0.8) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, 0);
        ctx.closePath();
        
        const auroraGrad = ctx.createLinearGradient(0, 0, 0, 160);
        const activeGreenAlpha = 0.09 * (1 + Math.sin(auroraPhase * 0.4)) * 0.5;
        const activePurpleAlpha = 0.07 * (1 + Math.cos(auroraPhase * 0.3)) * 0.5;

        auroraGrad.addColorStop(0, `rgba(52, 211, 153, ${activeGreenAlpha})`); // neon emerald green
        auroraGrad.addColorStop(0.5, `rgba(167, 139, 250, ${activePurpleAlpha})`); // soft purple
        auroraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = auroraGrad;
        ctx.fill();

        // 2. Constellation Lines
        ctx.lineWidth = 0.3;
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              const alpha = (1 - dist / 110) * 0.035 * Math.min(p1.alpha, p2.alpha);
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }

        // 3. Shooting Star
        if (!shootingStar.active && Math.random() < 0.0012) {
          shootingStar = {
            x: Math.random() * width * 0.7 + width * 0.15,
            y: Math.random() * height * 0.25,
            length: 90 + Math.random() * 70,
            speed: 13 + Math.random() * 7,
            opacity: 0.5 + Math.random() * 0.5,
            active: true,
          };
        }

        if (shootingStar.active) {
          const starGrad = ctx.createLinearGradient(
            shootingStar.x,
            shootingStar.y,
            shootingStar.x + shootingStar.length * 0.7,
            shootingStar.y - shootingStar.length * 0.7
          );
          starGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
          starGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.beginPath();
          ctx.strokeStyle = starGrad;
          ctx.lineWidth = 1.2;
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(
            shootingStar.x - shootingStar.length,
            shootingStar.y + shootingStar.length
          );
          ctx.stroke();

          shootingStar.x -= shootingStar.speed;
          shootingStar.y += shootingStar.speed;
          shootingStar.opacity -= 0.016;

          if (shootingStar.x < -100 || shootingStar.y > height + 100 || shootingStar.opacity <= 0) {
            shootingStar.active = false;
          }
        }
      }

      // Draw and update standard particles
      particles.forEach((p) => {
        if (weatherType === "rain" || weatherType === "storm") {
          // Draw falling streaks
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha})`; // sky-200 color
          ctx.lineWidth = p.size;
          ctx.stroke();

          // Move
          p.x += p.vx;
          p.y += p.vy;

          // Splash trigger upon hitting the bottom baseline
          if (p.y > height - 15) {
            if (Math.random() < 0.25) {
              splashes.push({
                x: p.x,
                y: height - Math.random() * 12,
                radius: 0.5,
                alpha: 0.22,
                maxRadius: 6 + Math.random() * 8,
              });
            }
            p.y = -20;
            p.x = Math.random() * width;
          }
        } else if (weatherType === "snow") {
          if (p.wobble !== undefined && p.wobbleSpeed !== undefined) {
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.35;
          }

          // Soft fuzzy radial snowball gradients
          const radialGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          radialGrad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
          radialGrad.addColorStop(0.4, `rgba(255, 255, 255, ${p.alpha * 0.4})`);
          radialGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = radialGrad;
          ctx.fill();

          p.y += p.vy;

          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        } else if (weatherType === "fog") {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(226, 232, 240, ${p.alpha})`);
          grad.addColorStop(0.5, `rgba(226, 232, 240, ${p.alpha * 0.4})`);
          grad.addColorStop(1, "rgba(226, 232, 240, 0)");

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          if (p.x - p.size > width) {
            p.x = -p.size;
            p.y = Math.random() * height;
          }
        } else if (weatherType === "clear-day") {
          // Drifting sakura blossom petals
          if (p.wobble !== undefined && p.wobbleSpeed !== undefined && p.angle !== undefined && p.spinSpeed !== undefined) {
            p.wobble += p.wobbleSpeed;
            p.x += Math.sin(p.wobble) * 0.2;
            p.angle += p.spinSpeed;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle || 0);

          ctx.beginPath();
          // Draw curved leaf/petal shape
          ctx.ellipse(0, 0, p.size * 1.4, p.size, 0, 0, Math.PI * 2);
          // Pink sakura color with transparency
          ctx.fillStyle = `rgba(244, 143, 177, ${p.alpha})`; 
          ctx.fill();

          // Add a subtle middle crease line
          ctx.beginPath();
          ctx.strokeStyle = `rgba(240, 98, 146, ${p.alpha * 1.5})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(-p.size * 1.2, 0);
          ctx.lineTo(p.size * 1.2, 0);
          ctx.stroke();

          ctx.restore();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y > height + 10 || p.x < -20) {
            p.y = -10;
            p.x = Math.random() * (width + 50);
          }
        } else if (weatherType === "clear-night") {
          // Twinkling stars
          if (p.wobbleSpeed !== undefined) {
            p.alpha += p.wobbleSpeed;
            if (p.alpha > 0.95 || p.alpha < 0.15) {
              p.wobbleSpeed = -p.wobbleSpeed;
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.15, Math.min(0.95, p.alpha))})`;
          ctx.fill();
        }
      });

      // Update and Draw Rain Splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.radius += 0.45;
        s.alpha -= 0.007;

        if (s.alpha <= 0 || s.radius >= s.maxRadius) {
          splashes.splice(i, 1);
        } else {
          ctx.beginPath();
          // Draw horizontal ellipse ring to simulate 3D ground splash
          ctx.ellipse(s.x, s.y, s.radius * 1.4, s.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(186, 230, 253, ${s.alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [weatherType, isEnabled, shouldDisableCanvas]);

  if (!isEnabled || shouldDisableCanvas || !weatherType) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full pointer-events-none block z-35"
      style={{ mixBlendMode: weatherType === "snow" || weatherType === "fog" || weatherType === "clear-night" ? "screen" : "normal" }}
    />
  );
}
