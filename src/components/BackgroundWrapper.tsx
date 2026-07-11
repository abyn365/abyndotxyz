import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Squares from "./Squares";
import ArtDots from "./ArtDots";

export default function BackgroundWrapper() {
  const [backdrop, setBackdrop] = useState("cyber-grid");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDataSaverActive, setIsDataSaverActive] = useState(false);
  const [overrideDataSaver, setOverrideDataSaver] = useState(false);
  const [dataSaverReason, setDataSaverReason] = useState("");

  useEffect(() => {
    const checkDiagnostics = async () => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.saveData) {
          setIsDataSaverActive(true);
          setDataSaverReason("Data Saver Active");
          return;
        }
        if (["2g", "3g"].includes(conn.effectiveType)) {
          setIsDataSaverActive(true);
          setDataSaverReason("Slow Connection");
          return;
        }
      }

      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const checkBattery = () => {
            if (battery.level < 0.20 && !battery.charging) {
              setIsDataSaverActive(true);
              setDataSaverReason("Low Battery Mode");
            } else {
              setIsDataSaverActive(false);
            }
          };

          checkBattery();
          battery.addEventListener("levelchange", checkBattery);
          battery.addEventListener("chargingchange", checkBattery);
          return () => {
            battery.removeEventListener("levelchange", checkBattery);
            battery.removeEventListener("chargingchange", checkBattery);
          };
        } catch {}
      }
    };

    checkDiagnostics();
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
    if (backdrop !== "space-dust" || (isDataSaverActive && !overrideDataSaver)) return;

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
  }, [backdrop, isDataSaverActive, overrideDataSaver]);

  if (isDataSaverActive && !overrideDataSaver) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 backdrop-blur-md text-[10px] font-mono font-bold text-amber-500 animate-fade-in print:hidden select-none">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>{dataSaverReason} (Backdrops Paused)</span>
        <button
          onClick={() => {
            setOverrideDataSaver(true);
          }}
          className="ml-1 px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors uppercase tracking-wider text-[8px]"
        >
          Enable
        </button>
      </div>
    );
  }

  return (
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
  );
}
