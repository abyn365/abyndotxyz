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
      className="rounded-xl border p-4 sm:p-6"
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
      }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-[var(--text-primary)]">
            Projects
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {loading ? 'Loading repositories…' : `${orderedProjects.length} projects`}
          </p>
        </div>

        {!loading && (
          <div className="inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs text-[var(--text-secondary)]" style={{ borderColor: 'var(--card-border)' }}>
            Page {page} of {totalPages}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] animate-pulse rounded-xl border p-5"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'var(--card-bg)',
                }}
                >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-4 w-2/3 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                  <div className="h-10 w-10 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                </div>
                <div className="mb-3 h-3 w-full rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                <div className="mb-4 h-3 w-11/12 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                <div className="mb-4 h-3 w-4/5 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                  <div className="h-6 w-14 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
                  <div className="h-6 w-12 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)]" />
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
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--card-border)',
            }}
            >
            <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
            {getPageNumbers().map((p, i) =>
              p === 'dots' ? (
                <span key={`dots-${i}`} className="px-1 text-sm text-[var(--text-secondary)]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-all duration-200"
                  style={
                    p === page
                      ? {
                          background: 'var(--accent)',
                          color: 'var(--accent-text)',
                        }
                      : {
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--card-border)',
                        }
                  }
                >
                  {p}
                </button>
              )
            )}
            </div>

            <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--card-border)',
            }}
            >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default Projects;