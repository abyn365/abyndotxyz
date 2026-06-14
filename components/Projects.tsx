import { useEffect, useMemo, useState } from 'react';
import { projects, type Project } from '../data/projects';
import ProjectCard from './ProjectCard';

const Projects = () => {
  const [githubProjects, setGithubProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGithubProjects = async () => {
      try {
        const res = await fetch('/api/github-projects');
        const data = await res.json();
        if (data?.repos) {
          setGithubProjects(data.repos);
        }
      } catch (error) {
        console.error('Failed to fetch GitHub repos', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGithubProjects();
  }, []);

  const orderedProjects = useMemo(() => {
    const pinned = projects.filter((project) => project.featured);
    const popular = projects.filter((project) => !project.featured && project.popular);

    const existingNames = new Set(pinned.map((project) => project.name));
    popular.forEach((project) => existingNames.add(project.name));

    const githubFallback = githubProjects.filter((project) => !existingNames.has(project.name));

    const ordered: Project[] = [...pinned, ...popular];
    if (ordered.length < 4) {
      ordered.push(...githubFallback.slice(0, 4 - ordered.length));
    }

    return ordered;
  }, [githubProjects]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {orderedProjects.map((project, index) => (
          <ProjectCard
            key={`${project.name}-${project.github ?? project.link ?? index}`}
            project={project}
            index={index}
          />
        ))}
      </div>
      {loading && (
        <div className="text-center text-xs text-[var(--text-secondary)] py-4">
          Loading repositories…
        </div>
      )}
    </div>
  );
};

export default Projects;