import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Squares from "./Squares";
import ArtDots from "./ArtDots";
import { usePerformanceSaver, triggerPerformanceStateChange } from "../hooks/usePerformanceSaver";

export default function BackgroundWrapper() {
  const [backdrop, setBackdrop] = useState("cyber-grid");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

          {backdrop === "deep-aura" && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
              <motion.div
                className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full blur-[130px]"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.08)" }}
                animate={{
                  x: [0, 40, -20, 0],
                  y: [0, -30, 20, 0],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full blur-[120px]"
                style={{ backgroundColor: "rgba(6, 182, 212, 0.06)" }}
                animate={{
                  x: [0, -30, 30, 0],
                  y: [0, 40, -20, 0],
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
