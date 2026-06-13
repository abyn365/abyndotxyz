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
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group block cursor-pointer rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        border: '1px solid var(--card-border)',
        background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
      }}
    >
      <div className="flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {project.github && (
              <FiGithub className="h-3.5 w-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
            {project.link && (
              <FiExternalLink className="h-3.5 w-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] line-clamp-2">
          {project.description}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1">
          {project.tech.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
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