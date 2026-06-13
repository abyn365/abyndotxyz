import useSWR from 'swr';
import { FiFolder } from 'react-icons/fi';
import ProjectCard from './ProjectCard';

interface GitHubProject {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  github: string;
  tech: string[];
}

const nativeFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const Projects = () => {
  const { data, error, isValidating } = useSWR<{ projects: GitHubProject[] }>(
    '/api/github-projects',
    nativeFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const projects = data?.projects || [];
  const isLoading = !data && !error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiFolder className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Projects</h2>
        </div>
        {isValidating && !isLoading && (
          <span className="text-[10px] text-[var(--text-secondary)] animate-pulse">
            Updating...
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-3.5 border animate-pulse flex flex-col gap-2.5"
              style={{
                borderColor: 'var(--card-border)',
                background: 'color-mix(in srgb, var(--text-primary) 2%, transparent)',
              }}
            >
              <div className="h-4 bg-zinc-300 dark:bg-zinc-800 rounded w-2/3" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-900 rounded w-full" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-900 rounded w-5/6" />
              <div className="flex gap-1 mt-1">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded-md w-12" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded-md w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4 text-xs text-[var(--text-secondary)]">
          Failed to load projects. Showing offline projects.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.name}
              project={{
                name: project.name,
                description: project.description || 'No description provided.',
                tech: project.tech.length > 0 ? project.tech : [project.language || 'Code'],
                github: project.github,
                stars: project.stars,
                forks: project.forks,
              }}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
