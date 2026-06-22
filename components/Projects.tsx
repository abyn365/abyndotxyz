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

  const paginatedProjects = orderedProjects.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
      className="rounded-3xl border p-4 sm:p-6"
      style={{
        borderColor: 'var(--card-border)',
        background: 'color-mix(in srgb, var(--card-bg-mix) 88%, transparent)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
            Projects
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {loading ? 'Loading repositories…' : `${orderedProjects.length} projects`}
          </p>
        </div>

        {!loading && (
          <div
            className="rounded-full border px-3 py-1 text-xs text-[var(--text-secondary)]"
            style={{ borderColor: 'var(--card-border)', background: 'var(--social-bg-mix)' }}
          >
            Page {page} of {totalPages}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] animate-pulse rounded-2xl border p-5"
                style={{
                  borderColor: 'var(--card-border)',
                  background: 'color-mix(in srgb, var(--card-bg-mix) 82%, transparent)',
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-4 w-2/3 rounded-full bg-[var(--social-bg-mix)]" />
                  <div className="h-9 w-9 rounded-full bg-[var(--social-bg-mix)]" />
                </div>
                <div className="mb-3 h-3 w-full rounded-full bg-[var(--social-bg-mix)]" />
                <div className="mb-2 h-3 w-11/12 rounded-full bg-[var(--social-bg-mix)]" />
                <div className="mb-5 h-3 w-4/5 rounded-full bg-[var(--social-bg-mix)]" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-[var(--social-bg-mix)]" />
                  <div className="h-6 w-14 rounded-full bg-[var(--social-bg-mix)]" />
                  <div className="h-6 w-12 rounded-full bg-[var(--social-bg-mix)]" />
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              color: 'var(--text-primary)',
              background: 'var(--social-bg-mix)',
              borderColor: 'var(--card-border)',
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {getPageNumbers().map((p, i) =>
              p === 'dots' ? (
                <span key={`dots-${i}`} className="px-1 text-sm text-[var(--text-secondary)]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-all duration-200"
                  style={
                    p === page
                      ? {
                          background: 'var(--accent)',
                          color: '#fff',
                          boxShadow: '0 8px 22px color-mix(in srgb, var(--accent) 35%, transparent)',
                        }
                      : {
                          color: 'var(--text-secondary)',
                          background: 'var(--social-bg-mix)',
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              color: 'var(--text-primary)',
              background: 'var(--social-bg-mix)',
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
