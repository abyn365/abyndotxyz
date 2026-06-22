import { motion } from 'framer-motion';
import { NextSeo } from 'next-seo';
import Squares from '../components/Squares';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Squares speed={0.15} squareSize={40} direction="diagonal" />
      </div>

      <NextSeo
        title="projects | abyn"
        description="Projects built by abyn."
        canonical="https://abyn.xyz/projects"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: 'https://abyn.xyz/projects',
          siteName: 'abyn',
          title: 'projects | abyn',
          description: 'Projects built by abyn.',
          images: [
            {
              url: 'https://abyn.xyz/banner.png',
              width: 1200,
              height: 630,
              alt: 'projects | abyn',
              type: 'image/gif',
            },
          ],
        }}
      />

      <div className="relative z-10">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mb-8 rounded-3xl border p-6 sm:p-8"
            style={{
              borderColor: 'var(--card-border)',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--card-bg-mix) 94%, transparent), color-mix(in srgb, var(--card-bg-mix) 100%, transparent))',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Selected work
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Projects
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Open-source projects, tools, and experiments I&apos;ve built.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <Projects />
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-10 border-t border-[var(--card-border)] pt-8 text-center text-sm text-[var(--text-secondary)]"
          >
            <a
              href="https://github.com/abyn365"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
            >
              abyn
            </a>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
