import type { AccentPalette } from "../../lib/music/accentColor";

interface Props {
  isPlaying: boolean;
  trackId?: string;
  className?: string;
  barCount?: number;
  height?: number;
  fixedColor?: string;
  isolated?: boolean;
}

/**
 * Visualizer removed as direct audio stream (Web Audio API AnalyserNode)
 * is blocked by YouTube CORS policies on the iframe.
 * Keeping a clean stub component to prevent page compile breakages.
 */
export default function MusicVisualizer(props: Props) {
  return null;
}
