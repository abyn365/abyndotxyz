import { motion } from 'framer-motion';
import { ArrowUpRight, Code2, GitBranch, Globe2, Sparkles, Star } from 'lucide-react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const destination = project.github || project.link;
  const topLanguages = project.languages?.slice(0, 3) ?? [];
  const shownTech = project.tech.slice(0, 4);
  const hasStats = project.stars !== undefined || topLanguages.length > 0;

  return (
    <motion.article
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="group h-full"
    >
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:p-6"
        style={{
          borderColor: 'var(--card-border)',
          background:
            'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--accent) 6%) 0%, var(--card-bg-mix) 48%, color-mix(in srgb, var(--bg-secondary) 88%, transparent) 100%)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_14%,transparent)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] blur-3xl transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-4" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--accent)_22%,var(--card-border))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] transition-transform duration-300 group-hover:scale-105">
              {project.github ? <GitBranch className="h-5 w-5" /> : <Code2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                {project.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                {project.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 font-medium text-[var(--accent)]">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                )}
                {project.stars !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-[var(--accent)] text-[var(--accent)]" />
                    {project.stars.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--social-bg-mix)] text-[var(--text-secondary)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--card-border))] group-hover:text-[var(--accent)]">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {project.description && (
          <p className="relative mt-5 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
            {project.description}
          </p>
        )}

        {project.homepage && (
          <div className="relative mt-4 inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
            <Globe2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.homepage}</span>
          </div>
        )}

        <div className="relative mt-auto pt-6">
          {hasStats && topLanguages.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]">
                {topLanguages.map((lang) => (
                  <span
                    key={lang.name}
                    className="bg-[var(--accent)] opacity-80"
                    style={{ width: `${lang.percentage}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                {topLanguages.map((lang) => (
                  <span key={lang.name}>
                    <span className="font-medium text-[var(--text-primary)]">{lang.name}</span>{' '}
                    {lang.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {shownTech.map((tech) => (
              <span key={tech} className="badge-tag border-[color-mix(in_srgb,var(--accent)_18%,var(--card-border))]">
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
