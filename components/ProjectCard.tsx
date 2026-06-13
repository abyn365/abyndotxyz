import { motion } from 'framer-motion';
import { FiGithub, FiExternalLink, FiStar, FiGitBranch } from 'react-icons/fi';

export interface ProjectCardProps {
  project: {
    name: string;
    description: string;
    tech: string[];
    github?: string;
    link?: string;
    stars?: number;
    forks?: number;
  };
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const primaryLink = project.github || project.link;

  return (
    <motion.a
      href={primaryLink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group block cursor-pointer rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--accent-glow)] border"
      style={{
        borderColor: 'var(--card-border)',
        background: 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
      }}
    >
      <div className="flex flex-col h-full justify-between gap-3">
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {project.github && (
                <FiGithub className="h-3.5 w-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
              )}
              {project.link && (
                <FiExternalLink className="h-3.5 w-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] line-clamp-2 h-8">
            {project.description}
          </p>
        </div>

        {/* Footer info: Tech stack + Stats */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--card-border)] border-dashed mt-1">
          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 2).map((tech) => (
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

          {/* Stars & Forks */}
          <div className="flex items-center gap-2.5 text-[10px] text-[var(--text-secondary)] font-medium">
            {typeof project.stars === 'number' && project.stars > 0 && (
              <span className="flex items-center gap-1 transition-colors group-hover:text-amber-500">
                <FiStar className="h-3 w-3 fill-current text-amber-500" />
                {project.stars}
              </span>
            )}
            {typeof project.forks === 'number' && project.forks > 0 && (
              <span className="flex items-center gap-1 transition-colors group-hover:text-sky-500">
                <FiGitBranch className="h-3 w-3 text-sky-500" />
                {project.forks}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
};

export default ProjectCard;
