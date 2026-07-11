import { useEffect, useRef } from "react";

// Classic 3D Improved Noise implementation for smooth flows
class ImprovedNoise {
  private p = new Uint8Array(512);

  constructor() {
    const permutation = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168, 68,175,74,
      165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
      102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,135,130,116,188,189,176,244,
      202,249,152,70,165,166,22,12,163,222, 5,147,24,150,164,185,34,95,107,245,182,124,153,167,42,243,1,101,232,
      104,184,84,121,40,98,223,142,39,181,228,51,206,197,116,110,75,32,80,48,118,199,240,4,85,150,212,37,118,
      83,28,110,109,177,122,4,248,227,241,136,120,29,136,78,128,201,111,139,8,191,95,20,239,190,88,209,137,251,
      244,30,82,128,121,116,85,250,55,122,141,83,77,229,180,244,96,204,236,179,203,178,180,201,201,154,232,124,
      129,94,224,196,91,224,253,19,137,225,25,104,137,244,224,127,104,233,180,194,244,213,200,104,224,191
    ];
    for (let i = 0; i < 256; i++) {
      this.p[i] = permutation[i];
      this.p[256 + i] = permutation[i];
    }
  }

  private fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  private lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  private grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number, z: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z), u),
        this.lerp(this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z), u)
      ),
      this.lerp(
        v,
        this.lerp(this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1), u)
      )
    );
  }
}

const perlin = new ImprovedNoise();

export default function ArtDots() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const SCALE = 200;
    const LENGTH = 10;
    const SPACING = 15;
    const points: Array<{ x: number; y: number; opacity: number }> = [];

    // Add grid points
    const initPoints = () => {
      points.length = 0;
      for (let x = -SPACING / 2; x < width + SPACING; x += SPACING) {
        for (let y = -SPACING / 2; y < height + SPACING; y += SPACING) {
          points.push({ x, y, opacity: Math.random() * 0.5 + 0.5 });
        }
      }
    };

    initPoints();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initPoints();
    };

    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const t = Date.now() / 10000;
      const isDark = document.documentElement.classList.contains("dark");
      const baseColor = isDark ? 55 : 200;

      for (const point of points) {
        const { x, y } = point;
        
        // noise returns value in range [-1, 1], map to angle [-2pi, 2pi]
        const nVal = perlin.noise(x / SCALE, y / SCALE, t);
        const rad = nVal * 2 * Math.PI;

        // length based on secondary noise sample
        const lenVal = perlin.noise(x / SCALE, y / SCALE, t * 2);
        const length = (lenVal + 0.5) * LENGTH;

        const nx = x + Math.cos(rad) * length;
        const ny = y + Math.sin(rad) * length;

        const cosRad = Math.cos(rad);
        const alpha = (Math.abs(cosRad) * 0.8 + 0.2) * point.opacity;

        ctx.fillStyle = `rgba(${baseColor}, ${baseColor}, ${baseColor}, ${alpha})`;
        ctx.fillRect(nx, ny, 2, 2);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full pointer-events-none block z-0"
    />
  );
}
