import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Globe2,
  Headphones,
  Mail,
  Music,
  Sparkles,
  Terminal,
} from "lucide-react";
import { FiGithub, FiInstagram } from "react-icons/fi";
import { SiDiscord, SiPinterest, SiSpotify, SiTiktok } from "react-icons/si";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import TimeWeather from "../components/TimeWeather";
import { useTopTracks } from "../hooks/useTopTracks";
import { formatPlaycount } from "../lib/music";

const BIRTH = new Date(2009, 3, 8);

function getAge() {
  const now = Date.now();
  const start = BIRTH.getTime();
  const yearMs =
    new Date(
      BIRTH.getFullYear() + 1,
      BIRTH.getMonth(),
      BIRTH.getDate()
    ).getTime() - start;
  return ((now - start) / yearMs).toFixed(10);
}

function LiveAge() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tick = () => {
      if (ref.current) ref.current.textContent = getAge();
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} className="font-mono tabular-nums" />;
}

const DISCORD_ID = "877018055815868426";

function makeAvatarUrl(id: string, hash: string) {
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=256`;
}

const STATUS_GLOW: Record<string, string> = {
  online: "var(--status-online)",
  idle: "var(--status-idle)",
};

const STATUS_DOT: Record<string, string> = {
  online: "var(--status-online)",
  idle: "var(--status-idle)",
  dnd: "var(--status-dnd)",
};

const SOCIALS = [
  { icon: FiGithub, label: "GitHub", href: "/github" },
  { icon: SiDiscord, label: "Discord", href: "/discord" },
  { icon: FiInstagram, label: "Instagram", href: "/instagram" },
  { icon: SiSpotify, label: "Spotify", href: "/spotify" },
  { icon: SiTiktok, label: "TikTok", href: "/tiktok" },
  { icon: SiPinterest, label: "Pinterest", href: "/pinterest" },
];

const metrics = [
  { label: "Origin", value: "Indonesia" },
  { label: "Stack", value: "Next.js" },
  { label: "Focus", value: "Live data" },
];

const principles = [
  "Fast by default",
  "Small details matter",
  "Built in public",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: "easeOut" },
});

type SpotifyNow = { song: string; artist: string; url: string } | null;

export default function Home() {
  const [avatar, setAvatar] = useState("");
  const [status, setStatus] = useState("");
  const [spotify, setSpotify] = useState<SpotifyNow>(null);
  const [scrobbles, setScrobbles] = useState<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `https://api.lanyard.rest/v1/users/${DISCORD_ID}`
        );
        const { success, data } = await res.json();
        if (!success) return;
        setAvatar(
          makeAvatarUrl(data.discord_user.id, data.discord_user.avatar)
        );
        setStatus(data.discord_status ?? "");
        setSpotify(
          data.spotify
            ? {
                song: data.spotify.song,
                artist: data.spotify.artist,
                url: `https://open.spotify.com/track/${data.spotify.track_id}`,
              }
            : null
        );
      } catch {}
    };
    poll();
    const id = setInterval(poll, 12_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/lastfm-stats")
      .then((r) => r.json())
      .then((d: { playcount?: number }) => {
        if (d.playcount) setScrobbles(d.playcount);
      })
      .catch(() => {});
  }, []);

  const { tracks: topTracks } = useTopTracks("short");
  const topTrack = topTracks[0];
  const dotColor = STATUS_DOT[status];
  const glowColor = STATUS_GLOW[status];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <motion.section {...fadeUp(0)} className="vercel-panel overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_390px]">
          <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div className="vercel-grid-mask absolute inset-0" />
            <div className="relative">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--geist-success)]" />
                Available for shipping tiny, polished things
              </div>

              <h1 className="max-w-4xl text-balance font-display text-5xl font-bold tracking-[-0.05em] text-[var(--text-primary)] sm:text-7xl lg:text-8xl">
                Building calm interfaces for a noisy internet.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
                I&apos;m Abyan — a student developer from Indonesia designing
                and deploying concise web experiences around music, presence,
                and live data.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/projects"
                  className="vercel-button vercel-button-primary"
                >
                  Explore projects <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="mailto:abyn@abyn.xyz"
                  className="vercel-button vercel-button-secondary"
                >
                  <Mail className="h-4 w-4" /> Contact
                </a>
              </div>

              <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-border)] sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-[var(--card-bg)] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="border-t border-[var(--card-border)] bg-[var(--bg-secondary)] p-4 lg:border-l lg:border-t-0">
            <div className="vercel-card h-full p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                    Profile deployment
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                    abyn.xyz
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
                {avatar && (
                  <div
                    className="relative h-16 w-16 overflow-hidden rounded-full border border-[var(--card-border)]"
                    style={{
                      boxShadow: glowColor
                        ? `0 0 28px ${glowColor}55`
                        : undefined,
                    }}
                  >
                    <Image
                      src={avatar}
                      alt="Abyan"
                      fill
                      sizes="64px"
                      priority
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Abyan
                  </p>
                  <p className="font-mono text-xs text-[var(--text-secondary)]">
                    / uh-bee-an /
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {dotColor && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                    <LiveAge /> yrs
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="vercel-terminal">
                  <div className="mb-3 flex items-center gap-2 text-[var(--text-secondary)]">
                    <Terminal className="h-4 w-4" />
                    <span className="font-mono text-xs">pnpm deploy</span>
                  </div>
                  {principles.map((item) => (
                    <p
                      key={item}
                      className="flex items-center gap-2 py-1 text-sm text-[var(--text-secondary)]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--geist-success)]" />
                      {item}
                    </p>
                  ))}
                </div>

                <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-primary)] p-4 text-sm">
                  <TimeWeather />
                </div>
                <DiscordStatus />
              </div>
            </div>
          </aside>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp(0.06)}
        className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]"
      >
        <div className="vercel-card p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Status
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Live signals
              </h2>
            </div>
            <VisitorStats />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {spotify && (
              <a
                href={spotify.url}
                target="_blank"
                rel="noopener noreferrer"
                className="vercel-signal-card group"
              >
                <Music className="h-5 w-5 text-[var(--text-secondary)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {spotify.song}
                  </p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">
                    {spotify.artist}
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-[var(--text-secondary)] transition-transform group-hover:translate-x-1" />
              </a>
            )}
            {topTrack && (
              <Link href="/music" className="vercel-signal-card group">
                <Headphones className="h-5 w-5 text-[var(--text-secondary)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {topTrack.title}
                  </p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">
                    {topTrack.artist} · {formatPlaycount(topTrack.playcount)}{" "}
                    plays
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-[var(--text-secondary)] transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {scrobbles !== null && (
              <div className="vercel-signal-card">
                <Globe2 className="h-5 w-5 text-[var(--text-secondary)]" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {formatPlaycount(scrobbles)}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    total scrobbles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="vercel-card p-6 sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Network
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Around the web
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--text-primary)]"
                >
                  <Icon className="h-4 w-4 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]" />
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </motion.section>

      <PageFooter />
    </main>
  );
}

export function PageFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--card-border)] pt-6 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
      <span>abyn.xyz</span>
      <span className="mx-2 text-[var(--card-border)]">·</span>
      <span>{new Date().getFullYear()}</span>
      <span className="mx-2 text-[var(--card-border)]">·</span>
      <a
        href="https://github.com/abyn365/abyndotxyz"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-[var(--text-primary)]"
      >
        source
      </a>
    </footer>
  );
}
