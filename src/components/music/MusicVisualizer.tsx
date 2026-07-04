import { useEffect, useRef } from "react";
import { MusicAudioPlayer } from "../../lib/music/audio-player";
import { useMusicPlayer } from "./MusicPlayerContext";

interface Props {
  isPlaying: boolean;
  trackId?: string;
  className?: string;
  barCount?: number;
  height?: number;
  fixedColor?: string;
  isolated?: boolean;
}

export default function MusicVisualizer({
  isPlaying,
  trackId,
  className = "",
  barCount = 20,
  height = 24,
  fixedColor,
  isolated = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { accentColor } = useMusicPlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const player = MusicAudioPlayer.getInstance();
    let analyser = isPlaying ? player.getAnalyser() : null;

    // Set up canvas sizing
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    let width = canvas.parentElement?.clientWidth || 120;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    // Wave animation offset for paused state
    let waveOffset = 0;

    const draw = () => {
      if (!canvas || !ctx) return;

      // Re-fetch analyser if player just started playing
      if (isPlaying && !analyser) {
        analyser = player.getAnalyser();
      }

      ctx.clearRect(0, 0, width, height);

      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      const barWidth = (width / barCount) - 1.5;
      let x = 0;

      const color1 = fixedColor || accentColor?.primary || "#3b82f6";
      const color2 = fixedColor || accentColor?.secondary || "#818cf8";

      waveOffset += 0.05;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * dataArray.length);
        const val = dataArray[dataIdx];

        let barHeight = 0;
        if (isPlaying) {
          if (analyser) {
            // Amplify for visual output on short heights
            barHeight = (val / 255) * height * 0.9;
            barHeight = Math.max(2, barHeight);
          } else {
            // Simulated bounce if playing but analyser not ready
            barHeight = (Math.sin(waveOffset + i * 0.8) + 1) * (height / 2.5) + 2;
          }
        } else {
          // Standing wave pattern when paused
          barHeight = (Math.sin(waveOffset * 0.2 + i * 0.4) + 1.2) * 1.5;
        }

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        ctx.fillStyle = gradient;

        const rx = x;
        const ry = height - barHeight;
        const rw = Math.max(1.5, barWidth);
        const rh = barHeight;
        const radius = Math.min(rw / 2, 1.5);

        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh);
        ctx.lineTo(rx, ry + rh);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();

        x += barWidth + 1.5;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (!canvas || !ctx) return;
      const newWidth = canvas.parentElement?.clientWidth || width;
      width = newWidth;
      canvas.width = newWidth * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, trackId, barCount, height, fixedColor, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full pointer-events-none ${className}`}
      style={{ height: `${height}px`, display: "block" }}
    />
  );
}
