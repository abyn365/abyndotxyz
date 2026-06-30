import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Music", href: "/music" },
  { label: "Uses", href: "/uses" },
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
    <nav className="sticky top-0 z-40 w-full border-b border-[var(--card-border)] bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          title={dotColor ? STATUS_LABEL[discordStatus] : undefined}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--card-border)] bg-[var(--text-primary)] text-xs font-bold text-[var(--bg-primary)] transition-transform group-hover:scale-95">
            A
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--text-primary)] sm:inline">
            abyn
          </span>
          {dotColor && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          )}
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-[var(--card-border)] bg-[var(--bg-secondary)] p-1 sm:flex">
            {NAV.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--text-primary)" : "transparent",
                    color: active
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-0.5 sm:hidden">
            {NAV.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2 py-2 text-xs font-medium"
                  style={{
                    color: active
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {item.label[0]}
                </Link>
              );
            })}
          </div>
          <ThemeToggle inline />
        </div>
      </div>
    </nav>
  );
}
