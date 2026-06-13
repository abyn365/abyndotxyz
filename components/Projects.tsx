import { FiFolder } from 'react-icons/fi';
import { projects } from '../data/projects';
import ProjectCard from './ProjectCard';

const Projects = () => {
  const featured = projects.filter(p => p.featured);
  const others = projects.filter(p => !p.featured);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FiFolder className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Projects</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Featured projects */}
        {featured.map((project, index) => (
          <ProjectCard key={project.name} project={project} index={index} />
        ))}
      </div>

      {/* Other projects */}
      {others.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {others.map((project, index) => (
            <ProjectCard
              key={project.name}
              project={project}
              index={featured.length + index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;