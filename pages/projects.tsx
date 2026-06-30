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

      <main className="premium-shell py-12 sm:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="premium-card mb-10 p-6 sm:p-8"
        >
          <p className="eyebrow mb-3">02 — Archive</p>
          <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-6xl">
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
