import React from "react";
import VisitorStats from "./Misc/VisitorStats.misc";

export function PageFooter() {
  return (
    <footer
      className="border-t pt-6 flex flex-wrap justify-center items-center gap-x-2 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]"
      style={{ borderColor: "var(--card-border)" }}
    >
      <span>abyn.xyz</span>
      <span style={{ color: "var(--card-border)" }}>·</span>
      <span>{new Date().getFullYear()}</span>
      <span style={{ color: "var(--card-border)" }}>·</span>
      <a
        href="https://github.com/abyn365/abyndotxyz"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-[var(--accent)]"
      >
        source
      </a>
      <span style={{ color: "var(--card-border)" }}>·</span>
      <VisitorStats />
      <span
        className="hidden sm:inline"
        style={{ color: "var(--card-border)" }}
      >
        ·
      </span>
      <span className="hidden opacity-50 sm:inline">
        press /? for shortcuts
      </span>
    </footer>
  );
}
