import React from "react";

export function PageFooter() {
  return (
    <footer
      className="border-t pt-6 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]"
      style={{ borderColor: "var(--card-border)" }}
    >
      <span>abyn.xyz</span>
      <span className="mx-2" style={{ color: "var(--card-border)" }}>
        ·
      </span>
      <span>{new Date().getFullYear()}</span>
      <span className="mx-2" style={{ color: "var(--card-border)" }}>
        ·
      </span>
      <a
        href="https://github.com/abyn365/abyndotxyz"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-[var(--accent)]"
      >
        source
      </a>
      <span
        className="mx-2 hidden sm:inline"
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
