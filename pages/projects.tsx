import { motion } from 'framer-motion';
import { NextSeo } from 'next-seo';
import Squares from '../components/Squares';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.15}
          squareSize={40}
          direction="diagonal"
        />
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

      {/* Content */}
      <div className="relative z-10 flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10 border-b border-[var(--card-border)] pb-8">
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
                Selected work
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
                Projects
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                Open-source projects, tools, and experiments presented with a clean portfolio-style layout.
              </p>
            </div>

            <Projects />
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-10 mt-10 border-t border-[var(--card-border)] text-center text-sm text-[var(--text-secondary)]"
          >
            <p>
              <a
                href="https://github.com/abyn365"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--accent)]"
                style={{ color: 'var(--accent)' }}
              >
                abyn
              </a>
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
