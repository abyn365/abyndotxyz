import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  FolderOpen,
  Headphones,
  Mail,
  Music,
} from "lucide-react";
import { FiGithub, FiInstagram } from "react-icons/fi";
import { SiDiscord, SiPinterest, SiSpotify, SiTiktok } from "react-icons/si";
import DiscordStatus from "../components/Misc/DiscordStatus.misc";
import VisitorStats from "../components/Misc/VisitorStats.misc";
import TimeWeather from "../components/TimeWeather";
import { useTopTracks } from "../hooks/useTopTracks";
import { formatPlaycount } from "../lib/music";
import { PageFooter } from "../components/PageFooter";


/* ─── Age counter ─────────────────────────────────────── */

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

/* ─── Discord helpers ─────────────────────────────────── */

import { DISCORD_ID } from "../lib/discord";

function makeAvatarUrl(id: string, hash: string) {
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=256`;
}

const STATUS_DOT: Record<string, string> = {
  online: "var(--status-online)",
  idle: "var(--status-idle)",
  dnd: "var(--status-dnd)",
};

/* ─── Socials ─────────────────────────────────────────── */

const SOCIALS = [
  { icon: FiGithub, label: "GitHub", href: "/github" },
  { icon: SiDiscord, label: "Discord", href: "/discord" },
  { icon: FiInstagram, label: "Instagram", href: "/instagram" },
  { icon: SiSpotify, label: "Spotify", href: "/spotify" },
  { icon: SiTiktok, label: "TikTok", href: "/tiktok" },
  { icon: SiPinterest, label: "Pinterest", href: "/pinterest" },
];

/* ─── Collapsible section ─────────────────────────────── */

function CollapsibleSection({
  index,
  label,
  defaultOpen = true,
  children,
}: {
  index: string;
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="transition-all duration-300 overflow-hidden border-b"
      style={{
        borderColor: "var(--card-border)",
        background: "transparent",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)] opacity-50">
            {index}
          </span>
          <span className="font-display text-sm font-bold text-[var(--text-primary)]">
            {label}
          </span>
        </div>
        <ChevronDown
          className="h-4 w-4 text-[var(--text-secondary)] transition-transform duration-250"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="pb-5 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: "easeOut" as const },
});

type SpotifyNow = { song: string; artist: string; url: string } | null;

export default function Home() {
  const [avatar, setAvatar] = useState("");
  const [status, setStatus] = useState("");
  const [spotify, setSpotify] = useState<SpotifyNow>(null);
  const [scrobbles, setScrobbles] = useState<number | null>(null);

  // Discord / Spotify presence
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

  // Last.fm total scrobbles
  useEffect(() => {
    fetch("/api/lastfm-stats")
      .then((r) => r.json())
      .then((d: { playcount?: number }) => {
        if (d.playcount) setScrobbles(d.playcount);
      })
      .catch(() => {});
  }, []);

  // Top track from Last.fm (for cross-link to /music)
  const { tracks: topTracks } = useTopTracks("short");
  const topTrack = topTracks[0];

  const dotColor = STATUS_DOT[status];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* ── Hero card ────────────────────────────────── */}
      <motion.section {...fadeUp(0)} className="mb-10">
        <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Text column */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              Abyan
            </h1>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
              / uh-bee-an /
            </p>

            {/* Live age pill */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-0 py-1.5">
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              >
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: "var(--accent)" }}
                />
              </span>
              <span className="font-mono text-[11px] uppercase tabular-nums tracking-[0.24em] text-[var(--text-secondary)]">
                <LiveAge /> <span>yrs</span>
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)] sm:text-base">
              Student developer from Indonesia. I build small, considered things
              for the web — usually involving live data, music, or whatever has
              my attention that week.
            </p>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[var(--text-secondary)]">
              <VisitorStats />
              {dotColor && (
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  {status === "dnd" ? "busy" : status}
                </span>
              )}
              {scrobbles !== null && (
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                  ♫ {formatPlaycount(scrobbles)}
                </span>
              )}
            </div>

            {/* Now playing — fully clickable */}
            {spotify && (
              <a
                href={spotify.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 flex items-center gap-2 px-0 py-1.5 text-xs transition-colors hover:text-[var(--accent)]"
              >
                <Music
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--accent)" }}
                />
                <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    {spotify.song}
                  </span>
                  {" — "}
                  {spotify.artist}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
              </a>
            )}

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                <FolderOpen className="h-4 w-4" />
                Projects
              </Link>
              <Link
                href="/music"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <Headphones className="h-4 w-4" />
                Music
              </Link>
              <a
                href="mailto:abyn@abyn.xyz"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                <Mail className="h-4 w-4" />
                Say hi
              </a>
            </div>
          </div>

          {/* Avatar column */}
          {avatar && (
            <div className="flex-shrink-0 self-center sm:self-start">
              <div className="relative">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                  <Image
                    src={avatar}
                    alt="Abyan"
                    fill
                    sizes="112px"
                    priority
                    className="object-cover"
                  />
                </div>
                {dotColor && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2"
                    style={{
                      backgroundColor: dotColor,
                      borderColor: "var(--bg-primary)",
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Top track cross-link → /music ────────────── */}
      {topTrack && (
        <motion.div {...fadeUp(0.04)} className="mb-8">
          <Link
            href="/music"
            className="group flex items-center gap-4 rounded-2xl px-1 py-2 transition-colors hover:bg-[var(--bg-secondary)]"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              {topTrack.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={topTrack.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <Music
                    className="h-5 w-5 opacity-20"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-mono text-[9px] uppercase tracking-[0.26em]"
                style={{ color: "var(--accent)" }}
              >
                Most played this month
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                {topTrack.title}
              </p>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {topTrack.artist} · {formatPlaycount(topTrack.playcount)} plays
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
          </Link>
        </motion.div>
      )}

      {/* ── Collapsible sections ──────────────────────── */}
      <motion.div {...fadeUp(0.08)} className="mb-12 space-y-6">
        <CollapsibleSection index="01" label="Right now" defaultOpen={false}>
          <div className="space-y-4">
            <div className="text-sm">
              <TimeWeather />
            </div>
            <div className="pt-1">
              <DiscordStatus />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          index="02"
          label="Around the web/socials"
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {s.label}
                  </span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)] opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              );
            })}
          </div>
        </CollapsibleSection>
      </motion.div>

      <PageFooter />
    </main>
  );
}


