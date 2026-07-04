/**
 * lib/music/accentColor.ts
 * Dynamic accent color system driven by album artwork.
 *
 * Uses colorthief v3 (getColorSync / getPaletteSync) to extract the dominant
 * color + palette from an image, then writes CSS custom properties to the
 * document root for smooth animated theming throughout the music player.
 *
 * CORS note: album art from external CDNs requires crossOrigin="anonymous"
 * on the image element. We load a fresh img with that attribute set.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AccentPalette {
  primary: string;   // hex – dominant color (contrast safe)
  secondary: string; // hex – complementary from palette (contrast safe)
  glow: string;      // rgba – translucent version for shadows/glows
  rgb: string;       // "r, g, b" for CSS variable interpolation
  text: string;      // hex - white or black for text drawn ON TOP of primary
}

const FALLBACK: AccentPalette = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  glow: "rgba(99, 102, 241, 0.45)",
  rgb: "99, 102, 241",
  text: "#ffffff",
};

// ---------------------------------------------------------------------------
// In-memory cache keyed by image URL
// ---------------------------------------------------------------------------
const cache = new Map<string, AccentPalette>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a hex string "#rrggbb" → [r, g, b] in 0–255 range */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Detect lightness/luminance and adjust the color for accessibility.
 * In Dark Mode: Ensure lightness is at least 0.58 (bright enough against dark background).
 * In Light Mode: Ensure lightness is at most 0.40 (dark enough against light background).
 */
function adjustContrast(hex: string, isDark: boolean): string {
  const [r, g, b] = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;

  if (d > 0.04) {
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;

    let newL = l;
    let newS = s;

    if (isDark) {
      newL = Math.max(0.58, l);
      newS = Math.min(1.0, s * 1.25);
    } else {
      newL = Math.min(0.40, l);
      newS = Math.min(1.0, s * 1.15);
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 0.5) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q2 = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
    const p2 = 2 * newL - q2;

    const nr = Math.round(hue2rgb(p2, q2, h + 1 / 3) * 255);
    const ng = Math.round(hue2rgb(p2, q2, h) * 255);
    const nb = Math.round(hue2rgb(p2, q2, h - 1 / 3) * 255);

    return "#" + [nr, ng, nb].map((v) =>
      Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")
    ).join("");
  }

  return isDark ? "#e4e4e7" : "#27272a";
}

/** Get accessible text color (black or white) depending on the color luminance */
function getContrastTextColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? "#000000" : "#ffffff";
}

/**
 * Load an image fresh with crossOrigin=anonymous so canvas reads succeed.
 */
function loadCORSImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Append a random param to bust any non-CORS cached response
    img.src = src.startsWith("data:")
      ? src
      : `${src}${src.includes("?") ? "&" : "?"}_ct=${Date.now()}`;
  });
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

/**
 * Extract a dominant color palette from an album artwork URL.
 * Returns an AccentPalette for CSS variable injection.
 * Falls back to FALLBACK on any error.
 */
export async function extractAccentColors(coverUrl: string): Promise<AccentPalette> {
  if (!coverUrl) return FALLBACK;

  const cached = cache.get(coverUrl);
  if (cached) return cached;

  try {
    const { getColorSync, getPaletteSync } = await import("colorthief");

    const img = await loadCORSImage(coverUrl);

    const dominant = getColorSync(img, { quality: 8 });
    const rawPalette = getPaletteSync(img, { colorCount: 8, quality: 8 });

    if (!dominant) return FALLBACK;

    // Detect if dark mode is active to adjust contrast
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

    const primaryHex = adjustContrast(dominant.hex(), isDark);

    // Pick a secondary that is visually different from primary
    let secondaryHex = FALLBACK.secondary;
    if (rawPalette) {
      for (const color of rawPalette) {
        const hex = color.hex();
        if (hex.toLowerCase() !== primaryHex.toLowerCase()) {
          secondaryHex = adjustContrast(hex, isDark);
          break;
        }
      }
    }

    // Build rgba glow from primary
    const [pr, pg, pb] = hexToRgb(primaryHex);
    const palette: AccentPalette = {
      primary: primaryHex,
      secondary: secondaryHex,
      glow: `rgba(${pr}, ${pg}, ${pb}, 0.35)`,
      rgb: `${pr}, ${pg}, ${pb}`,
      text: getContrastTextColor(primaryHex),
    };

    cache.set(coverUrl, palette);
    return palette;
  } catch {
    return FALLBACK;
  }
}

// ---------------------------------------------------------------------------
// CSS variable injection
// ---------------------------------------------------------------------------

/**
 * Write an AccentPalette to document root CSS custom properties.
 * The CSS transition on :root makes color changes animate smoothly.
 */
export function applyAccentToCSSVars(palette: AccentPalette): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--music-accent", palette.primary);
  root.style.setProperty("--music-accent-secondary", palette.secondary);
  root.style.setProperty("--music-glow", palette.glow);
  root.style.setProperty("--music-accent-rgb", palette.rgb);
  root.style.setProperty("--music-accent-fg", palette.text);
}

export function resetAccentCSSVars(): void {
  applyAccentToCSSVars(FALLBACK);
}

export { FALLBACK };
