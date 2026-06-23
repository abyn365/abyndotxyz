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
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group h-full"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl border p-6 transition-all duration-300"
        style={{
          borderColor: 'var(--card-border)',
          background: 'var(--card-bg)',
        }}
      >
        <div className="relative flex h-full flex-col">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-medium tracking-tight text-[var(--text-primary)] transition-colors">
                  {project.name}
                </h3>

                {project.featured && (
                  <span
                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-text)]"
                  >
                    Featured
                  </span>
                )}
              </div>

              {project.stars !== undefined && (
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  {project.stars.toLocaleString()} stars
                </p>
              )}
            </div>

            <ExternalLink className="h-4 w-4 text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {project.description && (
            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {project.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-1.5">
            {project.tech.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]"
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
