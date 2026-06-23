import { motion } from 'framer-motion';
import { NextSeo } from 'next-seo';
import Squares from '../components/Squares';
import Projects from '../components/Projects';

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-primary)]">
      <div className="fixed inset-0 z-0">
        <Squares speed={0.15} squareSize={42} direction="diagonal" />
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
        <div className="mx-auto w-full max-w-2xl px-6 pt-24 pb-12 sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-[var(--text-primary)]">
                Projects
              </h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                Open-source projects, tools, and experiments I&apos;ve built.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <Projects />
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 border-t border-[var(--border-color)] pt-12 text-center text-xs text-[var(--text-secondary)]"
          >
            <a
              href="https://github.com/abyn365"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              Abyan &copy; {new Date().getFullYear()}
            </a>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}
