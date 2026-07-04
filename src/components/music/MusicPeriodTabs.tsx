import { motion } from "framer-motion";
import { MUSIC_PERIODS, type MusicPeriod } from "../../lib/music";

type Props = { active: MusicPeriod; onChange: (p: MusicPeriod) => void };

export default function MusicPeriodTabs({ active, onChange }: Props) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-full p-0.5"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--card-border)",
      }}
    >
      {MUSIC_PERIODS.map((p) => {
        const isActive = p.value === active;
        return (
          <button
            key={p.value}
            type="button"
            title={p.description}
            onClick={() => onChange(p.value)}
            className="relative rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors"
            style={{
              color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="period-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--accent)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
