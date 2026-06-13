import { motion } from 'framer-motion';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <motion.a
      href={project.github || project.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bento-card group block cursor-pointer"
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {project.github && (
              <FiGithub className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
            {project.link && (
              <FiExternalLink className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2">
          {project.description}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1.5">
          {project.tech.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
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
      </div>
    </motion.a>
  );
};

export default ProjectCard;