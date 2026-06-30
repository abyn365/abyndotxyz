import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "Home", href: "/", index: "H" },
  { label: "Projects", href: "/projects", index: "P" },
  { label: "Music", href: "/music", index: "M" },
  { label: "Uses", href: "/uses", index: "U" },
];

const STATUS_DOT: Record<string, string> = {
  online: "var(--status-online)",
  idle: "var(--status-idle)",
  dnd: "var(--status-dnd)",
  offline: "var(--status-offline)",
};

const STATUS_LABEL: Record<string, string> = {
  online: "online",
  idle: "idle",
  dnd: "busy",
  offline: "offline",
};

export default function Navbar() {
  const router = useRouter();
  const [discordStatus, setDiscordStatus] = useState("");

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          "https://api.lanyard.rest/v1/users/877018055815868426"
        );
        const { success, data } = await res.json();
        if (success) setDiscordStatus(data.discord_status ?? "");
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  const dotColor = STATUS_DOT[discordStatus];

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b backdrop-blur-xl"
      style={{
        background: "color-mix(in srgb, var(--bg-primary) 78%, transparent)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="premium-shell flex h-16 items-center justify-between">
        {/* Brand + status dot */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
          title={dotColor ? STATUS_LABEL[discordStatus] : undefined}
        >
          <span className="font-display text-lg font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            abyn
          </span>
          {dotColor && (
            <span
              className="h-1.5 w-1.5 rounded-full transition-opacity"
              style={{ backgroundColor: dotColor }}
            />
          )}
        </Link>

        {/* Nav links + toggle */}
        <div
          className="flex items-center gap-1 rounded-full border p-1"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--card-bg)",
          }}
        >
          {NAV.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 transition-all duration-150 hover:bg-[var(--accent-muted)] sm:px-3"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <span className="hidden font-mono text-[9px] tabular-nums opacity-40 sm:inline">
                  {item.index}
                </span>
                <span className="relative text-xs font-medium">
                  {item.label}
                  {active && (
                    <span
                      className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </span>
              </Link>
            );
          })}

          <div className="ml-0.5">
            <ThemeToggle inline />
          </div>
        </div>
      </div>
    </nav>
  );
}
