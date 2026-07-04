import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const ErrorPage: NextPage = () => {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm text-center"
      >
        {/* Big track number */}
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          Track not found
        </p>

        <h1
          className="mt-2 font-display text-[8rem] font-bold leading-none tracking-tight sm:text-[10rem]"
          style={{ color: "var(--accent)" }}
        >
          404
        </h1>

        <div
          className="mx-auto my-6 h-px w-16"
          style={{ background: "var(--card-border)" }}
        />

        <p className="text-sm leading-7 text-[var(--text-secondary)]">
          This side of the record is blank. Whatever you were looking for
          wasn&apos;t pressed on this release.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card-bg)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to A-side
          </Link>
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          abyn.xyz · {new Date().getFullYear()}
        </p>
      </motion.div>
    </main>
  );
};

export default ErrorPage;
