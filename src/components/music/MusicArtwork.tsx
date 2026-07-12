import { Music2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePerformanceSaver } from "../../hooks/usePerformanceSaver";

type Props = {
  src?: string;
  canvasUrl?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

export default function MusicArtwork({
  src,
  canvasUrl,
  alt,
  className,
  fallbackClassName,
  iconClassName,
}: Props) {
  const [errored, setErrored] = useState(false);
  const { shouldDisableCanvas } = usePerformanceSaver();

  // Reset errored state when track cover or canvas URL changes
  useEffect(() => {
    setErrored(false);
  }, [src, canvasUrl]);

  if (!src || errored) {
    return (
      <div
        className={
          fallbackClassName ?? "flex h-full w-full items-center justify-center"
        }
        style={{ background: "var(--bg-secondary)" }}
      >
        <Music2
          className={iconClassName ?? "h-6 w-6 opacity-20"}
          style={{ color: "var(--text-primary)" }}
        />
      </div>
    );
  }

  if (canvasUrl && !shouldDisableCanvas && !errored) {
    return (
      <video
        key={canvasUrl}
        src={canvasUrl}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
