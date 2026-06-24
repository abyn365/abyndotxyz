import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Sparkles } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { projects as localProjects, type Project } from '../data/projects';
import ProjectCard from './ProjectCard';

const ITEMS_PER_PAGE = 8;
type SourceMode = 'featured' | 'github';

const Projects = () => {
  const [source, setSource] = useState<SourceMode>('featured');
  const [githubProjects, setGithubProjects] = useState<Project[]>([]);
  const [loadingGithub, setLoadingGithub] = useState(true);
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
        setLoadingGithub(false);
      }
    };

    fetchGithubProjects();
  }, []);

  const orderedProjects = useMemo(() => {
    if (source === 'featured') {
      return localProjects.filter((project) => project.featured);
    }

    return [...githubProjects].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  }, [source, githubProjects]);

  const totalPages = Math.max(1, Math.ceil(orderedProjects.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [source, orderedProjects.length]);

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

  const isLoading = source === 'github' && loadingGithub;
  const isFeaturedMode = source === 'featured';

  return (
    <section
      className="rounded-[2rem] border p-4 backdrop-blur-xl sm:p-6"
      style={{
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--card-border)',
                background: 'var(--card-bg-mix)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Selected work
            </span>
          </div>

          <h2 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
            Projects
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {isLoading
              ? 'Loading GitHub repositories…'
              : isFeaturedMode
                ? `${orderedProjects.length} featured projects`
                : `${orderedProjects.length} GitHub repositories`}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="inline-flex rounded-full border p-1"
            style={{
              borderColor: 'var(--card-border)',
              background: 'var(--card-bg-mix)',
            }}
          >
            <button
              onClick={() => setSource('featured')}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              style={
                source === 'featured'
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <LayoutGrid className="h-4 w-4" />
              Featured
            </button>

            <button
              onClick={() => setSource('github')}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              style={
                source === 'github'
                  ? { background: 'var(--accent)', color: 'var(--accent-text)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <FaGithub className="h-4 w-4" />
              GitHub
            </button>
          </div>

          {!isLoading && (
            <div
              className="inline-flex w-fit items-center rounded-full border px-3 py-2 text-xs text-[var(--text-secondary)]"
              style={{
                borderColor: 'var(--card-border)',
                background: 'var(--card-bg-mix)',
              }}
            >
              Page {page} of {totalPages}
            </div>
          )}
        </div>
      </div>

      {source === 'featured' && orderedProjects.length === 0 ? (
        <div
          className="rounded-3xl border p-8 text-center"
          style={{
            borderColor: 'var(--card-border)',
            background: 'var(--card-bg-mix)',
          }}
        >
          <p className="text-sm text-[var(--text-secondary)]">No featured projects yet.</p>
        </div>
      ) : (
        <>
          <div
            className={
              isFeaturedMode
                ? 'grid grid-cols-1 gap-4'
                : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
            }
          >
            {isLoading
              ? Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[320px] animate-pulse overflow-hidden rounded-[28px] border"
                    style={{
                      borderColor: 'var(--card-border)',
                      background: 'var(--card-bg-mix)',
                    }}
                  />
                ))
              : paginatedProjects.map((project, index) => (
                  <ProjectCard
                    key={`${project.name}-${project.github ?? project.link ?? index}`}
                    project={project}
                    index={index}
                    variant={isFeaturedMode ? 'featured' : 'grid'}
                  />
                ))}
          </div>

          {totalPages > 1 && !isLoading && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  color: 'var(--text-primary)',
                  background: 'var(--card-bg-mix)',
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
                              color: 'var(--accent-text)',
                              border: '1px solid var(--accent)',
                            }
                          : {
                              color: 'var(--text-secondary)',
                              background: 'var(--card-bg-mix)',
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
                  background: 'var(--card-bg-mix)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Projects;