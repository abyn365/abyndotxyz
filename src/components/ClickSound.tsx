/**
 * components/ClickSound.tsx
 * Plays a subtle beep sound on every click anywhere on the page.
 * Uses the Web Audio API with a tiny fetched buffer so it's near-instant.
 * Volume is kept low to be subtle (similar feel to ClickSpark but auditory).
 */

import { useEffect, useRef } from "react";

const CLICK_SOUND_URL = "https://cloud.abyn.xyz/file/sound/1782454288900_short-beep.mp3";
const CLICK_VOLUME = 0.12; // quiet — won't overpower music

export default function ClickSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const loadingRef = useRef(false);

  // Load the sound buffer once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadBuffer = async () => {
      if (loadingRef.current || bufferRef.current) return;
      loadingRef.current = true;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const res = await fetch(CLICK_SOUND_URL);
        const arrayBuffer = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        bufferRef.current = decoded;
      } catch (err) {
        console.warn("[ClickSound] Failed to load audio buffer:", err);
      } finally {
        loadingRef.current = false;
      }
    };

    // Load on first user interaction to respect autoplay policy
    const onFirstInteract = () => {
      loadBuffer();
      window.removeEventListener("pointerdown", onFirstInteract);
    };
    window.addEventListener("pointerdown", onFirstInteract, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstInteract);
    };
  }, []);

  // Play a click sound on every mouse/touch click
  useEffect(() => {
    if (typeof window === "undefined") return;

    const playClick = () => {
      const ctx = audioCtxRef.current;
      const buffer = bufferRef.current;

      if (!ctx || !buffer) return;

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = CLICK_VOLUME;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      } catch {
        // Silently ignore — not critical
      }
    };

    document.addEventListener("click", playClick, { passive: true });

    return () => {
      document.removeEventListener("click", playClick);
    };
  }, []);

  return null;
}
