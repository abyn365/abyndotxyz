import { motion } from "framer-motion";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { uses } from "../data/uses";
import { PageFooter } from "../components/PageFooter";

const NOTE_LABEL: Record<string, string> = {
  primary: "primary",
  daily:   "daily",
  display: "display",
  body:    "body",
};

export default function UsesPage() {
  return (
    <>
      <NextSeo
        title="uses — abyn"
        description="The stack, tools, and services I use day-to-day."
        canonical="https://abyn.xyz/uses"
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        {/* ── Header ─────────────────────────────────── */}
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
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            The stack, tools, and services I reach for when building things.
            Updated whenever something changes.
          </p>
        </motion.div>

        {/* ── Categories ─────────────────────────────── */}
        <div className="space-y-10">
          {uses.map((category, catIndex) => (
            <motion.section
              key={category.index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: catIndex * 0.04 }}
            >
              {/* Section label */}
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

              {/* Items */}
              <div
                className="divide-y border-t border-b"
                style={{
                  borderColor: "var(--card-border)",
                  background: "transparent",
                }}
              >
                {category.items.map((item) => {
                  const content = (
                    <div
                      className="flex items-start justify-between gap-4 px-2 py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {item.name}
                          </span>
                          {item.note && (
                            <span
                              className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                              style={{
                                borderColor: "var(--card-border)",
                                color: "var(--accent)",
                                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                              }}
                            >
                              {NOTE_LABEL[item.note] ?? item.note}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {item.url && (
                        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]" />
                      )}
                    </div>
                  );

                  return (
                    <div
                      key={item.name}
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block transition-colors hover:bg-[var(--bg-secondary)]/40"
                        >
                          {content}
                        </a>
                      ) : (
                        <div>{content}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="mt-12">
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
}
