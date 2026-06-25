import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { FolderOpen } from "lucide-react";
import { projects as featuredProjects, type Project } from "../data/projects";
import ProjectCard from "./ProjectCard";

const PER_PAGE = 6;

export default function Projects() {
  const [tab, setTab] = useState<"selected" | "archive">("selected");
  const [githubRepos, setGithubRepos] = useState<Project[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/github-projects")
      .then((r) => r.json())
      .then((d) => {
        if (d?.repos) setGithubRepos(d.repos);
      })
      .catch(console.error)
      .finally(() => setLoadingRepos(false));
  }, []);

  const items = useMemo(() => {
    if (tab === "selected") return featuredProjects.filter((p) => p.featured);
    return [...githubRepos].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  }, [tab, githubRepos]);

  useEffect(() => {
    setPage(1);
  }, [tab, items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const paged = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const isLoading = tab === "archive" && loadingRepos;

  return (
    <div>
      {/* Tab row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div
          className="inline-flex gap-0.5 rounded-full border p-0.5"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--bg-secondary)",
          }}
        >
          {(["selected", "archive"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: active
                    ? "var(--accent-text)"
                    : "var(--text-secondary)",
                }}
              >
                {t === "selected" ? (
                  <FolderOpen className="h-3.5 w-3.5" />
                ) : (
                  <FaGithub className="h-3.5 w-3.5" />
                )}
                {t === "selected" ? "Selected" : "Archive"}
              </button>
            );
          })}
        </div>
        {!isLoading && (
          <span className="font-mono text-xs text-[var(--text-secondary)]">
            {items.length} {tab === "selected" ? "projects" : "repos"}
          </span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border"
              style={{
                borderColor: "var(--card-border)",
                background: "var(--bg-secondary)",
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border px-6 py-16 text-center"
          style={{
            borderColor: "var(--card-border)",
            background: "var(--bg-secondary)",
          }}
        >
          <p className="font-display text-xl font-bold text-[var(--text-primary)]">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Check back soon.
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              tab === "selected" ? "grid gap-5" : "grid gap-4 md:grid-cols-2"
            }
          >
            {paged.map((project, i) => (
              <ProjectCard
                key={`${project.name}-${i}`}
                project={project}
                index={i}
                variant={tab === "selected" ? "featured" : "grid"}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <ChevronLeft className="h-4 w-4 text-[var(--text-primary)]" />
              </button>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
                style={{
                  borderColor: "var(--card-border)",
                  background: "var(--bg-secondary)",
                }}
              >
                <ChevronRight className="h-4 w-4 text-[var(--text-primary)]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
