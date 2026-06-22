import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const href = project.github || project.link;

  return (
    <motion.article
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300"
        style={{
          borderColor: 'var(--card-border)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--card-bg-mix) 92%, transparent), color-mix(in srgb, var(--card-bg-mix) 100%, transparent))',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%)',
          }}
        />

        <div className="relative flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                {project.name}
              </h3>

              {project.stars !== undefined && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  ★ {project.stars.toLocaleString()} stars
                </p>
              )}
            </div>

            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-105"
              style={{
                borderColor: 'color-mix(in srgb, var(--card-border) 80%, var(--accent) 20%)',
                background: 'color-mix(in srgb, var(--social-bg-mix) 85%, transparent)',
              }}
            >
              <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent)]" />
            </div>
          </div>

          {project.description && (
            <p className="mb-4 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
              {project.description}
            </p>
          )}

          {project.homepage && (
            <div className="mb-4">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Homepage
              </p>
              <span className="block truncate text-sm text-[var(--accent)] transition-colors group-hover:underline">
                {project.homepage}
              </span>
            </div>
          )}

          {project.languages && project.languages.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Languages
              </p>
              <div className="flex flex-wrap gap-2">
                {project.languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang.name}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--card-border) 75%, var(--accent) 25%)',
                      background: 'color-mix(in srgb, var(--social-bg-mix) 90%, transparent)',
                    }}
                  >
                    <span className="font-medium text-[var(--text-primary)]">{lang.name}</span>
                    <span className="text-[var(--text-secondary)]">{lang.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {project.tech.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide transition-colors"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                  color: 'var(--accent)',
                  borderColor: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </a>
    </motion.article>
  );
};

export default ProjectCard;
