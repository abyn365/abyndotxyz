"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NextSeo } from "next-seo";
import { ArrowUpRight } from "lucide-react";
import { uses } from "../data/uses";
import { PageFooter } from "../components/PageFooter";
import { useTheme } from "../components/ThemeProvider";

// ─── Note badge label map ────────────────────────────────────────────────────
const NOTE_LABEL: Record<string, string> = {
  primary: "primary",
  daily:   "daily",
  display: "display",
  body:    "body",
};

const NOTE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: "rgba(99,102,241,0.12)", text: "#818cf8", border: "rgba(99,102,241,0.3)" },
  daily:   { bg: "rgba(34,197,94,0.1)",  text: "#4ade80", border: "rgba(34,197,94,0.25)" },
  display: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  body:    { bg: "rgba(244,114,182,0.1)", text: "#f472b6", border: "rgba(244,114,182,0.3)" },
};

// ─── Simple Icons CDN helper ─────────────────────────────────────────────────
function getIconUrl(name: string, slug?: string, isDark?: boolean): string {
  const hex = isDark ? "ededed" : "111111";
  const iconSlug = slug ?? name.toLowerCase().replace(/[\s.]/g, "").replace(/[^a-z0-9]/g, "");
  return `https://cdn.simpleicons.org/${iconSlug}/${hex}`;
}

// ─── Tool Card ───────────────────────────────────────────────────────────────
function ToolCard({
  item,
  delay,
}: {
  item: (typeof uses)[0]["items"][0];
  delay: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [iconError, setIconError] = useState(false);
  const noteStyle = item.note ? NOTE_COLORS[item.note] : undefined;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.28, delay, ease: [0.25, 0.8, 0.25, 1] }}
      className="group relative flex flex-col gap-3 rounded-xl border p-4 transition-all duration-300"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      onMouseMove={(e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y / rect.height) - 0.5) * -5;
        const rotateY = ((x / rect.width) - 0.5) * 5;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.boxShadow = "var(--card-shadow), 0 12px 32px var(--accent-glow)";
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
        card.style.transition = "transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 400ms ease";
        card.style.boxShadow = "var(--card-shadow)";
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transition = "transform 80ms ease-out, box-shadow 80ms ease-out";
      }}
    >
      {/* Top row: icon + note badge */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderColor: "var(--card-border)",
          }}
        >
          {!iconError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getIconUrl(item.name, item.slug, isDark)}
              alt={item.name}
              className="h-5 w-5 object-contain"
              onError={() => setIconError(true)}
            />
          ) : (
            <span
              className="font-display text-sm font-bold"
              style={{ color: "var(--accent)" }}
            >
              {item.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Note badge */}
        {item.note && noteStyle && (
          <span
            className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
            style={{
              background: noteStyle.bg,
              color: noteStyle.text,
              borderColor: noteStyle.border,
            }}
          >
            {NOTE_LABEL[item.note] ?? item.note}
          </span>
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
          {item.name}
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {item.description}
        </p>
      </div>

      {/* Link indicator */}
      {item.url && (
        <div className="flex items-center justify-end">
          <ArrowUpRight
            className="h-3.5 w-3.5 text-[var(--text-secondary)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ color: "var(--accent)" }}
          />
        </div>
      )}
    </motion.div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {card}
      </a>
    );
  }
  return card;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function UsesPage() {
  const allCategories = ["All", ...uses.map((c) => c.name)];
  const [activeCategory, setActiveCategory] = useState("All");
  const chipScrollRef = useRef<HTMLDivElement>(null);

  const filteredCategories =
    activeCategory === "All"
      ? uses
      : uses.filter((c) => c.name === activeCategory);

  // Count per category for the chips
  const countMap: Record<string, number> = { All: uses.reduce((s, c) => s + c.items.length, 0) };
  uses.forEach((c) => { countMap[c.name] = c.items.length; });

  return (
    <>
      <NextSeo
        title="uses — abyn"
        description="The stack, tools, and services I use day-to-day."
        canonical="https://abyn.xyz/uses"
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {/* ── Header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            04 — Setup
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Uses
          </h1>
          {/* Animated gradient underline */}
          <div
            className="mt-2 h-px w-16"
            style={{
              background: "linear-gradient(90deg, var(--accent), transparent)",
            }}
          />
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            The stack, tools, and services I reach for when building things.
            Updated whenever something changes.
          </p>
        </motion.div>

        {/* ── Category Filter Chips ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          ref={chipScrollRef}
          className="scrollbar-none mb-8 flex gap-2 overflow-x-auto pb-1"
        >
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200"
                style={{
                  background: isActive ? "var(--accent)" : "transparent",
                  borderColor: isActive ? "var(--accent)" : "var(--card-border)",
                  color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
                }}
              >
                {cat}
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.15)"
                      : "color-mix(in srgb, var(--accent) 10%, transparent)",
                    color: isActive ? "var(--accent-text)" : "var(--accent)",
                  }}
                >
                  {countMap[cat]}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Card Grid ────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {filteredCategories.map((category) => (
              <section key={category.index}>
                {/* Section header */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                    {category.index}
                  </span>
                  <span
                    className="flex-1 border-t"
                    style={{ borderColor: "var(--card-border)" }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                    {category.name}
                  </span>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item, i) => (
                    <ToolCard key={item.name} item={item} delay={i * 0.04} />
                  ))}
                </div>
              </section>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-14">
          <PageFooter />
        </div>
      </main>
    </>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60,
  };
};
