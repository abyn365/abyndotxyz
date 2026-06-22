import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const href = project.github || project.link || project.homepage || '#';
  const hasSource = Boolean(project.github);
  const hasHome = Boolean(project.homepage);

  return (
    <motion.article
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-300"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
          boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 55%)',
          }}
        />

        <div className="relative flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-white">
                  {project.name}
                </h3>

                {project.featured && (
                  <span
                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    Featured
                  </span>
                )}
              </div>

              {project.stars !== undefined && (
                <p className="text-xs text-[var(--text-secondary)]">
                  ★ {project.stars.toLocaleString()} stars
                </p>
              )}
            </div>

            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-105"
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] transition-colors group-hover:text-white" />
            </div>
          </div>

          {project.description && (
            <p className="mb-5 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
              {project.description}
            </p>
          )}

          <div className="mb-4 space-y-3">
            {hasHome && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Homepage
                </p>
                <p className="truncate text-sm text-[var(--text-primary)]/90 transition-colors group-hover:text-white group-hover:underline">
                  {project.homepage}
                </p>
              </div>
            )}

            {project.languages && project.languages.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.languages.slice(0, 3).map((lang) => (
                    <span
                      key={lang.name}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                      style={{
                        borderColor: 'rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.035)',
                      }}
                    >
                      <span className="font-medium text-[var(--text-primary)]">{lang.name}</span>
                      <span className="text-[var(--text-secondary)]">{lang.percentage}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {project.tech.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-primary)',
                    borderColor: 'rgba(255,255,255,0.10)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>

            {hasSource && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                style={{
                  color: 'var(--text-secondary)',
                  borderColor: 'rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <FaGithub className="h-3.5 w-3.5" />
                Source
              </span>
            )}
          </div>
        </div>
      </a>
    </motion.article>
  );
};

export default ProjectCard;
