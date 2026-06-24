import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Globe, ImageOff, Star } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
  variant?: 'grid' | 'featured';
}

const ProjectCard = ({ project, index, variant = 'grid' }: ProjectCardProps) => {
  const href = project.github || project.link || project.homepage || '#';
  const hasSource = Boolean(project.github);
  const hasHome = Boolean(project.homepage);
  const imageSrc = project.image?.trim();
  const isFeatured = variant === 'featured';

  if (isFeatured) {
    return (
      <motion.article
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
        whileHover={{ y: -4 }}
        className="group"
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="grid overflow-hidden rounded-[28px] border transition-all duration-300 sm:grid-cols-[1.05fr_0.95fr]"
          style={{
            borderColor: 'var(--card-border)',
            background: 'var(--card-bg)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex flex-col justify-between p-6 md:p-8">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {project.featured && (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      color: 'var(--text-primary)',
                      borderColor: 'var(--card-border)',
                      background: 'var(--card-bg-mix)',
                    }}
                  >
                    Featured
                  </span>
                )}

                {project.popular && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{
                      color: 'var(--text-primary)',
                      borderColor: 'var(--card-border)',
                      background: 'var(--card-bg-mix)',
                    }}
                  >
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {project.name}
              </h3>

              {project.description && (
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  {project.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {project.tech.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                    style={{
                      background: 'var(--card-bg-mix)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <span
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium"
                style={{
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--card-border)',
                  background: 'var(--card-bg-mix)',
                }}
              >
                <FaGithub className="h-3.5 w-3.5" />
                Source
              </span>
            </div>
          </div>

          <div className="relative min-h-56 overflow-hidden sm:min-h-[320px]">
            {imageSrc ? (
              <>
                <img
                  src={imageSrc}
                  alt={project.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/5 to-black/10 dark:from-transparent dark:via-black/10 dark:to-black/35" />
              </>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: 'var(--card-bg-mix)' }}
              >
                <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                  <ImageOff className="h-6 w-6" />
                  <span className="text-xs uppercase tracking-[0.2em]">No preview</span>
                </div>
              </div>
            )}

            <div className="absolute right-4 top-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-300 group-hover:scale-105"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'color-mix(in srgb, var(--card-bg) 82%, transparent)',
                }}
              >
                <ArrowUpRight className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
            </div>
          </div>
        </a>
      </motion.article>
    );
  }

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
        className="relative flex h-full overflow-hidden rounded-[28px] border transition-all duration-300"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="flex w-full flex-col">
          <div className="relative h-44 overflow-hidden sm:h-48">
            {imageSrc ? (
              <>
                <img
                  src={imageSrc}
                  alt={project.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent dark:from-black/55 dark:via-black/10" />
              </>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: 'var(--card-bg-mix)' }}
              >
                <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                  <ImageOff className="h-6 w-6" />
                  <span className="text-xs uppercase tracking-[0.2em]">No preview</span>
                </div>
              </div>
            )}

            <div className="absolute right-4 top-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-300 group-hover:scale-105"
                style={{
                  borderColor: 'rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.12)',
                }}
              >
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] sm:text-[16px]">
                  {project.name}
                </h3>

                {project.stars !== undefined && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <Star className="h-3 w-3" />
                    {project.stars.toLocaleString()} stars
                  </p>
                )}
              </div>

              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-105"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'var(--card-bg-mix)',
                }}
              >
                {hasSource ? (
                  <FaGithub className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : hasHome ? (
                  <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </div>
            </div>

            {project.description && (
              <p className="mb-5 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                {project.description}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {project.tech.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                    style={{
                      background: 'var(--card-bg-mix)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                style={{
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--card-border)',
                  background: 'var(--card-bg-mix)',
                }}
              >
                <FaGithub className="h-3.5 w-3.5" />
                {hasSource ? 'Source' : 'Open'}
              </span>
            </div>
          </div>
        </div>
      </a>
    </motion.article>
  );
};

export default ProjectCard;