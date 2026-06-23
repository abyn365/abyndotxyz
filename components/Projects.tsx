import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { projects, type Project } from '../data/projects';
import ProjectCard from './ProjectCard';

const ITEMS_PER_PAGE = 8;

const Projects = () => {
  const [githubProjects, setGithubProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchGithubProjects = async () => {
      try {
        const res = await fetch('/api/github-projects');
        const data = await res.json();
        if (data?.repos) setGithubProjects(data.repos);
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

    return [...pinned, ...popular, ...githubFallback];
  }, [githubProjects]);

  const totalPages = Math.max(1, Math.ceil(orderedProjects.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [orderedProjects.length]);

  const paginatedProjects = orderedProjects.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const goToPage = (nextPage: number) => {
    if (nextPage >= 1 && nextPage <= totalPages) setPage(nextPage);
  };

  const getPageNumbers = (): (number | 'dots')[] => {
    const pages: (number | 'dots')[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push('dots');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('dots');

    pages.push(totalPages);
    return pages;
  };

  return (
    <section
      className="rounded-xl border p-6 sm:p-8"
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
      }}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-[var(--text-primary)]">
            Projects
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {loading ? 'Loading repositories…' : `${orderedProjects.length} projects`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {loading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] animate-pulse rounded-xl border p-6"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'var(--bg-secondary)',
                }}
                >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-5 w-2/3 rounded bg-[var(--border-color)]" />
                  <div className="h-4 w-4 rounded bg-[var(--border-color)]" />
                </div>
                <div className="mb-3 h-4 w-full rounded bg-[var(--border-color)]" />
                <div className="mb-6 h-4 w-11/12 rounded bg-[var(--border-color)]" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 rounded bg-[var(--border-color)]" />
                  <div className="h-6 w-14 rounded bg-[var(--border-color)]" />
                </div>
              </div>
            ))
          : paginatedProjects.map((project, index) => (
              <ProjectCard
                key={`${project.name}-${project.github ?? project.link ?? index}`}
                project={project}
                index={index}
              />
            ))}
      </div>

      {totalPages > 1 && !loading && (
        <div className="mt-12 flex items-center justify-between">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p, i) =>
              p === 'dots' ? (
                <span key={`dots-${i}`} className="px-2 text-sm text-[var(--text-secondary)]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default Projects;
