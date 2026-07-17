import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Squares from "./Squares";
import ArtDots from "./ArtDots";
import { usePerformanceSaver, triggerPerformanceStateChange } from "../hooks/usePerformanceSaver";

export default function BackgroundWrapper() {
  const [backdrop, setBackdrop] = useState("cyber-grid");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wavesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nebulaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { shouldDisableBackdrops } = usePerformanceSaver();

  // Battery diagnostic listener
  useEffect(() => {
    let cleanupBattery: (() => void) | undefined;

    const setupBattery = async () => {
      if (typeof window === "undefined" || !("getBattery" in navigator)) return;
      try {
        const battery = await (navigator as any).getBattery();
        const checkBattery = () => {
          const isLow = battery.level < 0.20 && !battery.charging;
          const wasLow = sessionStorage.getItem("site-low-battery") === "true";
          if (isLow !== wasLow) {
            sessionStorage.setItem("site-low-battery", isLow ? "true" : "false");
            triggerPerformanceStateChange();
          }
        };

        checkBattery();
        battery.addEventListener("levelchange", checkBattery);
        battery.addEventListener("chargingchange", checkBattery);

        cleanupBattery = () => {
          battery.removeEventListener("levelchange", checkBattery);
          battery.removeEventListener("chargingchange", checkBattery);
        };
      } catch (err) {
        // Ignore battery API failures
      }
    };

    setupBattery();
    return () => {
      if (cleanupBattery) cleanupBattery();
    };
  }, []);

  // FPS check to detect slow device (runs after site entry)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If slow device evaluation has already run for this session, skip
    if (sessionStorage.getItem("site-slow-device") !== null) {
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    const deltas: number[] = [];
    let animationId: number;
    let timeoutId: any;

    const runFpsCheck = () => {
      const measure = (time: number) => {
        frameCount++;
        const delta = time - lastTime;
        lastTime = time;

        // Skip the first few frames to allow transitions/rendering to settle
        if (frameCount > 15) {
          deltas.push(delta);
        }

        if (deltas.length < 100) {
          animationId = requestAnimationFrame(measure);
        } else {
          const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
          const fps = 1000 / avgDelta;
          const isSlow = fps <= 30;
          sessionStorage.setItem("site-slow-device", isSlow ? "true" : "false");
          triggerPerformanceStateChange();
        }
      };

      // Delay by 2.5 seconds to let initial animations finish
      timeoutId = setTimeout(() => {
        animationId = requestAnimationFrame(measure);
      }, 2500);
    };

    const hasEntered = sessionStorage.getItem("has_entered") === "true";
    if (hasEntered) {
      runFpsCheck();
    } else {
      const handleSiteEntered = () => {
        runFpsCheck();
        window.removeEventListener("site-entered", handleSiteEntered);
      };
      window.addEventListener("site-entered", handleSiteEntered);
      return () => {
        window.removeEventListener("site-entered", handleSiteEntered);
        clearTimeout(timeoutId);
        if (animationId) cancelAnimationFrame(animationId);
      };
    }

    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("site-backdrop") || "cyber-grid";
    setBackdrop(saved);

    const handleBackdropChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setBackdrop(customEvent.detail || "cyber-grid");
    };

    window.addEventListener("site-backdrop-change", handleBackdropChange);
    return () => window.removeEventListener("site-backdrop-change", handleBackdropChange);
  }, []);

  // Canvas drawing effect for Space Dust
  useEffect(() => {
    if (backdrop !== "space-dust" || shouldDisableBackdrops) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      fadeSpeed: number;
    }> = [];

    // Mouse coordinates tracker using useRef to avoid re-renders
    const mouseRef = { x: width / 2, y: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.x = e.clientX;
      mouseRef.y = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    // Initialize stars
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        alpha: Math.random(),
        fadeSpeed: (Math.random() * 0.005) + 0.002,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw starry space dust
      particles.forEach((p) => {
        // Move towards mouse coordinates subtly
        const dx = mouseRef.x - p.x;
        const dy = mouseRef.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 250) {
          p.x += (dx / dist) * 0.25;
          p.y += (dy / dist) * 0.25;
        }

        // Standard drift
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Twinkle effect (alpha modulation)
        p.alpha += p.fadeSpeed;
        if (p.alpha > 1 || p.alpha < 0.1) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 119, 198, ${Math.max(0, p.alpha * 0.35)})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [backdrop, shouldDisableBackdrops]);

  // Canvas drawing effect for Nexus Waves
  useEffect(() => {
    if (backdrop !== "nexus-waves" || shouldDisableBackdrops) return;

    const canvas = wavesCanvasRef.current;
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

    const mouseRef = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.x = e.clientX;
      mouseRef.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const particleCount = Math.min(80, Math.floor(width / 15));
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.8,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const rootStyle = getComputedStyle(document.documentElement);
      const musicAccentStr = rootStyle.getPropertyValue("--music-accent").trim() || "#6366f1";

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx = -p.vx;
        if (p.y < 0 || p.y > height) p.vy = -p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.07;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        if (mouseRef.x > 0 && mouseRef.y > 0) {
          const dx = p1.x - mouseRef.x;
          const dy = p1.y - mouseRef.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `${musicAccentStr}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseRef.x, mouseRef.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [backdrop, shouldDisableBackdrops]);



  // Canvas drawing effect for Cosmic Nebula
  useEffect(() => {
    if (backdrop !== "cosmic-nebula" || shouldDisableBackdrops) return;

    const canvas = nebulaCanvasRef.current;
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

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      alpha: number;
      twinkleSpeed: number;
    }> = [];

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.1 + 0.3,
        speedY: -0.05 - Math.random() * 0.05,
        alpha: Math.random(),
        twinkleSpeed: 0.005 + Math.random() * 0.015,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) p.y = height;

        p.alpha += p.twinkleSpeed;
        if (p.alpha > 0.8 || p.alpha < 0.1) {
          p.twinkleSpeed = -p.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, p.alpha * 0.35)})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [backdrop, shouldDisableBackdrops]);

  return (
    <>
      {!shouldDisableBackdrops && (
        <>
          {backdrop === "cyber-grid" && (
            <Squares direction="diagonal" speed={0.05} squareSize={32} />
          )}

          {backdrop === "flowing-dots" && <ArtDots />}

          {backdrop === "space-dust" && (
            <canvas
              ref={canvasRef}
              className="fixed inset-0 h-full w-full pointer-events-none block z-0"
            />
          )}

          {backdrop === "nexus-waves" && (
            <canvas
              ref={wavesCanvasRef}
              className="fixed inset-0 h-full w-full pointer-events-none block z-0"
            />
          )}



          {backdrop === "cosmic-nebula" && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute -top-20 left-1/4 h-[550px] w-[550px] rounded-full blur-[140px] opacity-25"
                style={{ backgroundColor: "rgba(99, 102, 241, 0.16)" }}
                animate={{
                  x: [0, 60, -40, 0],
                  y: [0, 80, -30, 0],
                  scale: [1, 1.15, 0.9, 1],
                }}
                transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full blur-[150px] opacity-20"
                style={{ backgroundColor: "rgba(168, 85, 247, 0.14)" }}
                animate={{
                  x: [0, -70, 50, 0],
                  y: [0, -50, 80, 0],
                  scale: [1, 0.85, 1.1, 1],
                }}
                transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-20 left-10 h-[500px] w-[500px] rounded-full blur-[130px] opacity-25"
                style={{ backgroundColor: "rgba(6, 182, 212, 0.14)" }}
                animate={{
                  x: [0, 50, -30, 0],
                  y: [0, -60, 40, 0],
                  scale: [1, 1.1, 0.85, 1],
                }}
                transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
              />
              <canvas
                ref={nebulaCanvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none block"
              />
            </div>
          )}


        </>
      )}
    </>
  );
}
