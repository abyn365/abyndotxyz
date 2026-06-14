import { motion } from 'framer-motion';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group transition-all duration-300 hover:scale-105"
    >
      <a
        href={project.github || project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-xl border transition-all duration-300"
        style={{
          border: '1px solid var(--card-border)',
          background: 'color-mix(in srgb, var(--text-primary) 2%, transparent)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {project.name}
            </h3>
            {project.stars !== undefined && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                ⭐ {project.stars.toLocaleString()} stars
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {project.github && (
              <FiGithub className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
            {project.link && (
              <FiExternalLink className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3 mb-3">
            {project.description}
          </p>
        )}

        {/* Homepage / About Link */}
        {project.homepage && (
          <div className="text-xs mb-3">
            <span className="text-[var(--accent)] break-all cursor-pointer hover:underline">
              {project.homepage}
            </span>
          </div>
        )}

        {/* Languages */}
        {project.languages && project.languages.length > 0 && (
          <div className="text-xs text-[var(--text-secondary)] mb-3 space-y-1">
            <div className="font-medium text-[var(--text-primary)]">Languages:</div>
            <div className="flex flex-wrap gap-2">
              {project.languages.slice(0, 3).map((lang) => (
                <span key={lang.name} className="inline-flex">
                  <span className="text-[var(--accent)]">{lang.name}</span>
                  <span className="text-[var(--text-secondary)] ml-1">{lang.percentage}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1.5">
          {project.tech.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center rounded px-2 py-1 text-[11px] font-medium"
              style={{
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </a>
    </motion.div>
  );
};

export default ProjectCard;