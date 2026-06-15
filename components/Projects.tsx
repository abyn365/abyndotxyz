import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
    ordered.push(...githubFallback);

    return ordered;
  }, [githubProjects]);

  const totalPages = Math.max(1, Math.ceil(orderedProjects.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [orderedProjects.length]);

  const paginatedProjects = orderedProjects.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
    }
  };

  // Generate page numbers to show (max 5 around current)
  const getPageNumbers = (): (number | 'dots')[] => {
    const pages: (number | 'dots')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('dots');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {paginatedProjects.map((project, index) => (
          <ProjectCard
            key={`${project.name}-${project.github ?? project.link ?? index}`}
            project={project}
            index={index}
          />
        ))}
      </div>

      {loading && (
        <div className="text-center text-xs text-[var(--text-secondary)] py-4">
          Loading repositories&hellip;
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {/* Previous */}
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-lg p-2 text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
              background: 'var(--social-bg-mix)',
              border: '1px solid var(--card-border)',
            }}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, i) =>
            p === 'dots' ? (
              <span key={`dots-${i}`} className="px-1 text-sm text-[var(--text-secondary)]">
                &hellip;
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                style={
                  p === page
                    ? { background: 'var(--accent)', color: '#fff' }
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

          {/* Next */}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center rounded-lg p-2 text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: page === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
              background: 'var(--social-bg-mix)',
              border: '1px solid var(--card-border)',
            }}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Projects;