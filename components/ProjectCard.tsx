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

  return (
    <motion.article
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="group h-full"
    >
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full min-h-[250px] flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:p-6"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--social-bg-mix)] text-[var(--text-secondary)] transition-colors duration-300 group-hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--card-border))] group-hover:text-[var(--accent)]">
              {project.github ? <GitBranch className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                {project.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                {project.featured && (
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)]">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                )}
                {project.stars !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-[var(--accent)]" />
                    {project.stars.toLocaleString()} stars
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {project.description && (
          <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">
            {project.description}
          </p>
        )}

        {project.homepage && (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--accent)]">
            <Globe2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.homepage}</span>
          </div>
        )}

        <div className="mt-auto pt-6">
          {topLanguages.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-[var(--text-secondary)]">
              {topLanguages.map((lang) => (
                <span key={lang.name} className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_55%,var(--text-secondary))]" />
                  <span className="font-medium text-[var(--text-primary)]">{lang.name}</span>
                  <span>{lang.percentage}%</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {shownTech.map((tech) => (
              <span key={tech} className="badge-tag bg-[color-mix(in_srgb,var(--text-primary)_4%,transparent)]">
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
