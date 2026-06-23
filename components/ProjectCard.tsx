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
      className="group h-full"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border p-4 transition-all duration-200"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
        }}
      >
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                  {project.name}
                </h3>

                {project.featured && (
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>

              {project.stars !== undefined && (
                <p className="text-xs text-[var(--text-secondary)]">
                  ★ {project.stars.toLocaleString()} stars
                </p>
              )}
            </div>

            <ExternalLink className="h-4 w-4 flex-shrink-0 text-[var(--text-secondary)]" />
          </div>

          {project.description && (
            <p className="mb-4 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
              {project.description}
            </p>
          )}

          <div className="mb-3 space-y-2">
            {hasHome && (
              <div>
                <p className="mb-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                  Homepage
                </p>
                <p className="truncate text-sm text-[var(--text-primary)]/80 transition-colors group-hover:underline">
                  {project.homepage}
                </p>
              </div>
            )}

            {project.languages && project.languages.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                  Languages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.languages.slice(0, 3).map((lang) => (
                    <span
                      key={lang.name}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                      }}
                    >
                      <span className="text-[var(--text-primary)]">{lang.name}</span>
                      <span className="text-[var(--text-secondary)]">{lang.percentage}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-[var(--card-border)]">
            <div className="flex flex-wrap gap-1.5">
              {project.tech.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-xs text-[var(--text-secondary)]"
                >
                  {tech}
                </span>
              ))}
            </div>

            {hasSource && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
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