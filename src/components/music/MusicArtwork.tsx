import { Music2 } from "lucide-react";
import { useState } from "react";

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

  if (canvasUrl && !errored) {
    return (
      <video
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
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
