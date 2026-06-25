import { motion } from "framer-motion";
import { NextSeo } from "next-seo";
import Projects from "../components/Projects";
import { PageFooter } from "./index";

export default function ProjectsPage() {
  return (
    <>
      <NextSeo
        title="projects — abyn"
        description="Selected projects and open-source work by Abyan."
        canonical="https://abyn.xyz/projects"
      />

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            02 — Archive
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Projects
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Selected work I've built and open-source code on GitHub. More things
            are usually in progress.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
        >
          <Projects />
        </motion.div>

        <div className="mt-12">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
