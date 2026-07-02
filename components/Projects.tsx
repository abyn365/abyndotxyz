import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, FolderOpen, Activity } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { projects as featuredProjects, type Project } from "../data/projects";
import ProjectCard from "./ProjectCard";

const PER_PAGE = 6;
const ROWS = 7;
const USERNAME = "abyn365";

// --- Types for GitHub Graph ---
interface ContributionDay {
  count: number;
  date: string;
}

interface GitHubEvent {
  type: string;
  repo: { name: string };
  payload?: {
    commits?: Array<{ message: string }>;
    ref_type?: string;
    ref?: string;
    action?: string;
    release?: { tag_name: string };
  };
  created_at: string;
}

interface CommitData {
  message: string;
  repo: string;
  date: string;
}

interface TooltipState {
  count: number;
  date: string;
  x: number;
  y: number;
}

function formatEvent(event: GitHubEvent) {
  const repo = event.repo?.name?.split("/")[1] || event.repo?.name;
  switch (event.type) {
    case "PushEvent": {
      const commits = event.payload?.commits || [];
      const lastCommit = commits[commits.length - 1];
      const msg = lastCommit?.message?.split("\n")[0]?.slice(0, 50);
      return {
        icon: "⬆",
        text: msg || `pushed to ${repo}`,
        repo: event.repo?.name,
      };
    }
    case "CreateEvent":
      return {
        icon: "+",
        text: `created ${event.payload?.ref_type} ${event.payload?.ref || ""}`,
        repo: event.repo?.name,
      };
    case "DeleteEvent":
      return {
        icon: "✕",
        text: `deleted ${event.payload?.ref_type} ${event.payload?.ref}`,
        repo: event.repo?.name,
      };
    case "WatchEvent":
      return { icon: "★", text: "starred", repo: event.repo?.name };
    case "ForkEvent":
      return { icon: "⑂", text: "forked", repo: event.repo?.name };
    case "IssuesEvent":
      return {
        icon: "●",
        text: `${event.payload?.action} issue`,
        repo: event.repo?.name,
      };
    case "PullRequestEvent":
      return {
        icon: "⇄",
        text: `${event.payload?.action} PR`,
        repo: event.repo?.name,
      };
    case "ReleaseEvent":
      return {
        icon: "◆",
        text: `released ${event.payload?.release?.tag_name}`,
        repo: event.repo?.name,
      };
    default:
      return null;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// --- Sub-Component: GitHub Graph & Eating Snake Animation ---
function GitHubGraph() {
  const [weeks, setWeeks] = useState<ContributionDay[][]>([]);
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [eatenPositions, setEatenPositions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalCommits, setTotalCommits] = useState(0);
  const [weekCommits, setWeekCommits] = useState(0);
  const [topRepo, setTopRepo] = useState<any>(null);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  
  const snakeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch contribution grid data
    fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`)
      .then((r) => r.json())
      .then((data) => {
        const contributions: ContributionDay[] = data.contributions || [];
        const grid: ContributionDay[][] = [];
        let weekArr: ContributionDay[] = [];
        let total = 0;
        let thisWeek = 0;
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        contributions.forEach((day) => {
          total += day.count;
          if (new Date(day.date) >= weekAgo) thisWeek += day.count;
          weekArr.push({ count: day.count, date: day.date });
          if (weekArr.length === ROWS) {
            grid.push(weekArr);
            weekArr = [];
          }
        });
        if (weekArr.length > 0) {
          while (weekArr.length < ROWS) {
            weekArr.push({ count: 0, date: "" });
          }
          grid.push(weekArr);
        }

        setTotalCommits(total);
        setWeekCommits(thisWeek);

        const last24 = grid.slice(-24);
        setWeeks(last24);
        setLoading(false);

        // Wait exactly 3 seconds on initial page load before starting the snake
        snakeTimeoutRef.current = setTimeout(() => {
          startSnake(last24);
        }, 3000);
      })
      .catch(() => setLoading(false));

    const headers: Record<string, string> = {};

    // Fetch repositories and sort descending manually to find top project accurately
    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, { headers })
      .then((r) => r.json())
      .then((repos) => {
        if (Array.isArray(repos) && repos.length > 0) {
          const sorted = repos
            .filter((r: any) => !r.fork)
            .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count);
          if (sorted.length > 0) setTopRepo(sorted[0]);
        }
      })
      .catch(() => {});

    // Fetch Public Activity Feed
    fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=5`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data.slice(0, 5));
        const pushRepos = [
          ...new Set(
            (Array.isArray(data) ? data : [])
              .filter((e) => e.type === "PushEvent")
              .map((e) => e.repo?.name)
              .filter(Boolean),
          ),
        ].slice(0, 3);

        Promise.all(
          pushRepos.map((repo) =>
            fetch(`https://api.github.com/repos/${repo}/commits?per_page=3`, { headers })
              .then((r) => r.json())
              .then((d) =>
                (Array.isArray(d) ? d : []).map((c) => ({
                  message: c.commit?.message?.split("\n")[0],
                  repo: repo.split("/")[1],
                  date: c.commit?.author?.date,
                })),
              )
              .catch(() => []),
          ),
        ).then((all) =>
          setCommits(
            all
              .flat()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5),
          ),
        );
      })
      .catch(() => {});

    return () => stopSnake();
  }, []);

  const stopSnake = () => {
    if (snakeIntervalRef.current) clearInterval(snakeIntervalRef.current);
    if (snakeTimeoutRef.current) clearTimeout(snakeTimeoutRef.current);
  };

  // --- Target Eating & Dynamic Length Growth Engine ---
  const startSnake = (grid: ContributionDay[][]) => {
    stopSnake();
    if (!grid.length) return;

    const cols = grid.length;
    let pos = { x: 0, y: Math.floor(ROWS / 2) };
    let dir = { x: 1, y: 0 };
    let path = [{ ...pos }];
    let currentMaxLength = 3; // Starts at traditional base length
    
    const localEaten = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;
    const isValid = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < ROWS;

    // Pre-calculate the total food pieces scattered on the timeline grid
    let totalTargetFoodCells = 0;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (grid[x]?.[y] && grid[x][y].count > 0) totalTargetFoodCells++;
      }
    }

    const tick = () => {
      // 1. Pathfinding: Locate the closest active contribution square
      let target: { x: number; y: number } | null = null;
      let minDist = Infinity;

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < ROWS; y++) {
          const cell = grid[x]?.[y];
          if (cell && cell.count > 0 && !localEaten.has(key(x, y))) {
            const dist = Math.abs(x - pos.x) + Math.abs(y - pos.y);
            if (dist < minDist) {
              minDist = dist;
              target = { x, y };
            }
          }
        }
      }

      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      // Build out standard safe options within bounds
      const inBoundsMoves = directions.filter((d) => isValid(pos.x + d.x, pos.y + d.y));

      if (inBoundsMoves.length === 0) {
        handleResetCycle(grid);
        return;
      }

      // Filter options to prevent body collision
      const activeBody = path.slice(-currentMaxLength);
      let safeMoves = inBoundsMoves.filter((d) => {
        const nx = pos.x + d.x;
        const ny = pos.y + d.y;
        return !activeBody.some((b) => b.x === nx && b.y === ny);
      });

      // ESCAPE MECHANISM: If completely enclosed, clip through body to keep going until everything is eaten
      if (safeMoves.length === 0) {
        safeMoves = inBoundsMoves;
      }

      let chosenDir = dir;
      if (target) {
        // Order choices to continuously narrow down distance to the targeted square
        safeMoves.sort((a, b) => {
          const distA = Math.abs(pos.x + a.x - target!.x) + Math.abs(pos.y + a.y - target!.y);
          const distB = Math.abs(pos.x + b.x - target!.x) + Math.abs(pos.y + b.y - target!.y);
          return distA - distB;
        });
        chosenDir = safeMoves[0];
      } else {
        const keepGoing = safeMoves.find((m) => m.x === dir.x && m.y === dir.y);
        chosenDir = keepGoing || safeMoves[Math.floor(Math.random() * safeMoves.length)];
      }

      dir = chosenDir;
      pos = { x: pos.x + dir.x, y: pos.y + dir.y };

      // 3. Digest food target
      const currentCell = grid[pos.x]?.[pos.y];
      if (currentCell && currentCell.count > 0 && !localEaten.has(key(pos.x, pos.y))) {
        localEaten.add(key(pos.x, pos.y));
        // Permanent tail growth calculation based on elements consumed
        currentMaxLength = 3 + localEaten.size;
        setEatenPositions(new Set(localEaten));
      }

      path = [...path, { ...pos }].slice(-currentMaxLength);
      setSnake([...path]);

      // Complete cycle check: triggers ONLY when all cells are completely eaten
      if (localEaten.size >= totalTargetFoodCells && totalTargetFoodCells > 0) {
        handleResetCycle(grid);
      }
    };

    const handleResetCycle = (currentGrid: ContributionDay[][]) => {
      stopSnake();
      setSnake([]);
      setEatenPositions(new Set());
      // Wait exactly 3 seconds before spawning the next round sequence
      snakeTimeoutRef.current = setTimeout(() => {
        startSnake(currentGrid);
      }, 3000);
    };

    snakeIntervalRef.current = setInterval(tick, 110);
  };

  // High contrast palette tuned for both light and dark backgrounds
  const getColor = (count: number, isEaten: boolean) => {
    if (count === 0 || isEaten) {
      return "bg-zinc-200 dark:bg-zinc-800/60 transition-all duration-300";
    }
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-950/60";
    if (count <= 5) return "bg-emerald-300 dark:bg-emerald-800/60";
    if (count <= 10) return "bg-emerald-400 dark:bg-emerald-600/70";
    return "bg-emerald-500 dark:bg-emerald-400/80";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="h-28 w-full skeleton-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800/50" />
    );
  }

  return (
    <div className="mt-1">
      {/* Mini Stats Banner */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
        <span>
          <strong className="text-[var(--text-primary)]">{totalCommits.toLocaleString()}</strong> commits
        </span>
        <span>
          <strong className="text-emerald-600 dark:text-emerald-400">{weekCommits}</strong> this week
        </span>
        {topRepo && (
          <a
            href={topRepo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            top: <span className="text-violet-600 dark:text-violet-400 font-medium">{topRepo.name}</span> ★{topRepo.stargazers_count}
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matrix Grid */}
        <div className="overflow-x-auto pb-2 lg:col-span-2">
          <div className="flex gap-[3px] min-w-max">
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[3px]">
                {week.map((day, row) => {
                  const snakeIdx = snake.findIndex((s) => s.x === col && s.y === row);
                  const isSnake = snakeIdx !== -1;
                  const isHead = snakeIdx === snake.length - 1;
                  const isEaten = eatenPositions.has(`${col},${row}`);

                  return (
                    <div
                      key={row}
                      onMouseEnter={(e) => {
                        if (!day.date) return;
                        setTooltip({
                          count: isEaten ? 0 : day.count,
                          date: day.date,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onMouseMove={(e) =>
                        setTooltip((prev) =>
                          prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                        )
                      }
                      className={`w-[13px] h-[13px] rounded-[2px] transition-all duration-150 ${
                        isSnake
                          ? isHead
                            ? "bg-zinc-950 dark:bg-zinc-50 scale-125 shadow-md z-10"
                            : "bg-violet-500/80 dark:bg-violet-400/80"
                          : getColor(day.count, isEaten)
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        {events.length > 0 && (
          <div className="space-y-2 min-w-0 border-t border-dashed border-[var(--card-border)] pt-4 lg:border-t-0 lg:pt-0">
            {events
              .filter((e) => Date.now() - new Date(e.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
              .map((e, i) => {
                if (e.type === "PushEvent") {
                  const commit = commits.find((c) => c.repo === e.repo?.name?.split("/")[1]);
                  if (commit) {
                    return (
                      <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-zinc-400 w-3 text-center flex-shrink-0">⬆</span>
                        <span className="text-[var(--text-secondary)] truncate">{commit.message}</span>
                        <a
                          href={`https://github.com/${USERNAME}/${commit.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors flex-shrink-0"
                        >
                          · {commit.repo}
                        </a>
                        <span className="text-zinc-500 dark:text-zinc-600 ml-auto flex-shrink-0">
                          {timeAgo(e.created_at)}
                        </span>
                      </div>
                    );
                  }
                }
                const f = formatEvent(e);
                if (!f) return null;
                return (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="w-3 text-center flex-shrink-0 text-zinc-400">{f.icon}</span>
                    <span className="text-[var(--text-secondary)] truncate">{f.text}</span>
                    <a
                      href={`https://github.com/${f.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors flex-shrink-0"
                    >
                      · {f.repo?.split("/")[1]}
                    </a>
                    <span className="text-zinc-500 dark:text-zinc-600 ml-auto flex-shrink-0">
                      {timeAgo(e.created_at)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg border text-[11px] shadow-xl pointer-events-none font-sans backdrop-blur-sm"
          style={{
            borderColor: "var(--card-border)",
            background: "rgba(15, 15, 15, 0.92)",
            color: "#fff",
            left: tooltip.x + 12,
            top: tooltip.y - 34,
          }}
        >
          <span className="font-semibold">{tooltip.count}</span>
          <span className="opacity-80"> {tooltip.count === 1 ? "contribution" : "contributions"} on </span>
          <span className="opacity-90 font-medium text-zinc-300">{formatDate(tooltip.date)}</span>
        </div>
      )}
    </div>
  );
}

// --- Main Portfolio Component ---
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
    <div className="space-y-8">
      {/* Activity Timeline Section — Configured with #FFFFFDFA for Light Modes */}
      <div
        className="rounded-2xl border p-5 sm:p-6 bg-[#FFFFFDFA] dark:bg-[var(--bg-secondary)]"
        style={{
          borderColor: "var(--card-border)",
        }}
      >
        <h3 className="mb-4 flex items-center gap-2 font-medium text-sm text-[var(--text-primary)]">
          <Activity className="h-4 w-4 text-violet-500" />
          <span>Activity Timeline</span>
        </h3>
        <GitHubGraph />
      </div>

      <div>
        {/* Navigation Tabs row */}
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

        {/* Layout Window Grid */}
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
    </div>
  );
}
