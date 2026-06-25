import { useEffect, useRef, useState } from "react";
import styles from "./BackgroundEffect.module.css";

type Boid = {
  id: number;
  seed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
};

type MouseState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  strength: number;
  targetStrength: number;
  pressed: number;
};

const BOID_AMOUNT = 20;
const REPEL_DISTANCE = 200;
const clampDimension = (value: number) => Math.max(1, value || 1);

function createBoid(id: number, width: number, height: number): Boid {
  const seed = Math.random() + 1;
  return {
    id,
    seed,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    hue: Math.random() * 70 + 210,
  };
}

function getRadius(boid: Boid, width: number, height: number) {
  const areaScale = Math.sqrt(width * height) / 10;
  return Math.min(Math.max(boid.seed * areaScale * 1.2, 150), 440);
}

export default function BackgroundEffect() {
  const measureRef = useRef<HTMLDivElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const mouseRef = useRef<MouseState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    strength: 0,
    targetStrength: 0,
    pressed: 0,
  });
  const frameRef = useRef(0);
  const sizeRef = useRef({ width: 1, height: 1 });
  const [frame, setFrame] = useState({
    width: 1,
    height: 1,
    boids: [] as Boid[],
    mouse: mouseRef.current,
  });

  useEffect(() => {
    let nextId = 0;

    const resize = () => {
      const previous = sizeRef.current;
      const width = clampDimension(window.innerWidth);
      const height = clampDimension(
        measureRef.current?.clientHeight || window.innerHeight
      );
      const scaleX = width / previous.width;
      const scaleY = height / previous.height;

      boidsRef.current = boidsRef.current.map((boid) => ({
        ...boid,
        x: boid.x * scaleX,
        y: boid.y * scaleY,
      }));

      while (boidsRef.current.length < BOID_AMOUNT) {
        boidsRef.current.push(createBoid(nextId, width, height));
        nextId += 1;
      }

      if (boidsRef.current.length > BOID_AMOUNT) {
        boidsRef.current = boidsRef.current.slice(0, BOID_AMOUNT);
      }

      sizeRef.current = { width, height };
    };

    const moveMouse = (x: number, y: number) => {
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
      mouseRef.current.targetStrength = 1;
    };

    const onMouseMove = (event: MouseEvent) => {
      moveMouse(event.clientX, event.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) moveMouse(touch.clientX, touch.clientY);
    };
    const press = () => {
      mouseRef.current.pressed = 1;
      mouseRef.current.targetStrength = 1;
    };
    const release = () => {
      mouseRef.current.pressed = 0;
    };

    const update = () => {
      const { width, height } = sizeRef.current;
      const boids = boidsRef.current;

      for (const boid of boids) {
        boid.x += boid.vx;
        boid.y += boid.vy;

        const radius = getRadius(boid, width, height);
        if (boid.x < -radius) boid.x += width + 2 * radius;
        else if (boid.x > width + radius) boid.x -= width + 2 * radius;

        if (boid.y < -radius) boid.y += height + 2 * radius;
        else if (boid.y > height + radius) boid.y -= height + 2 * radius;

        for (const other of boids) {
          if (boid === other) continue;
          const dx = boid.x - other.x;
          const dy = boid.y - other.y;
          const distance = Math.hypot(dx, dy) || 1;

          if (distance < REPEL_DISTANCE) {
            boid.vx += (dx / distance / distance) * 0.48;
            boid.vy += (dy / distance / distance) * 0.48;
          }
        }

        boid.vx *= 0.99;
        boid.vy *= 0.99;
      }

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;
      mouse.targetStrength = mouse.pressed
        ? mouse.targetStrength * 0.9 + 0.1
        : mouse.targetStrength * 0.9;
      mouse.strength += (mouse.targetStrength - mouse.strength) * 0.3;

      setFrame({
        width,
        height,
        boids: boids.map((boid) => ({ ...boid })),
        mouse: { ...mouse },
      });

      frameRef.current = requestAnimationFrame(update);
    };

    resize();
    update();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mousedown", press);
    window.addEventListener("touchstart", press, { passive: true });
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("mouseleave", release);
    window.addEventListener("touchcancel", release);
    window.addEventListener("blur", release);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousedown", press);
      window.removeEventListener("touchstart", press);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
      window.removeEventListener("mouseleave", release);
      window.removeEventListener("touchcancel", release);
      window.removeEventListener("blur", release);
    };
  }, []);

  return (
    <>
      <div ref={measureRef} aria-hidden="true" className={styles.measure} />
      <svg
        aria-hidden="true"
        className={styles.background}
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          {frame.boids.map((boid) => (
            <radialGradient
              key={boid.id}
              id={`boid-gradient-${boid.id}`}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop
                offset="0%"
                stopColor={`hsla(${boid.hue}, 100%, 58%, 0.24)`}
              />
              <stop
                offset="100%"
                stopColor={`hsla(${boid.hue}, 100%, 56%, 0)`}
              />
            </radialGradient>
          ))}
          <radialGradient
            id="mouse-gradient"
            cx="50%"
            cy="50%"
            r="50%"
            fx="50%"
            fy="50%"
          >
            <stop
              offset="0%"
              stopColor={`hsla(270, 100%, 58%, ${
                frame.mouse.strength * (frame.mouse.pressed * 0.125 + 0.125)
              })`}
            />
            <stop offset="100%" stopColor="hsla(270, 100%, 58%, 0)" />
          </radialGradient>
          <filter id="background-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.06" />
            </feComponentTransfer>
          </filter>
        </defs>

        <rect
          width={frame.width}
          height={frame.height}
          className={styles.base}
        />
        {frame.boids.map((boid) => (
          <circle
            key={boid.id}
            cx={boid.x}
            cy={boid.y}
            r={getRadius(boid, frame.width, frame.height)}
            fill={`url(#boid-gradient-${boid.id})`}
          />
        ))}
        <circle
          cx={frame.mouse.x}
          cy={frame.mouse.y}
          r={frame.mouse.strength * 140}
          fill="url(#mouse-gradient)"
        />
        <rect
          width={frame.width}
          height={frame.height}
          filter="url(#background-noise)"
          opacity="1"
        />
      </svg>
    </>
  );
}
