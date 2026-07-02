import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, FolderOpen, Activity, Gamepad2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { projects as featuredProjects, type Project } from "../data/projects";
import ProjectCard from "./ProjectCard";

const PER_PAGE = 6;
const ROWS = 7;
const COLS = 24;
const USERNAME = "abyn365";

// --- Types for GitHub Graph & Game Engine ---
interface ContributionDay {
  count: number;
  date: string;
  isObstacle?: boolean;
}

interface TooltipState {
  count: number;
  date: string;
  x: number;
  y: number;
}

// --- Cookie Helper Utilities ---
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

// --- Sub-Component: GitHub Graph & Interactive Arcade Game ---
function GitHubGraph() {
  const [weeks, setWeeks] = useState<ContributionDay[][]>([]);
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [eatenPositions, setEatenPositions] = useState<Set<string>>(new Set());
  const [flashStatus, setFlashStatus] = useState<"red" | "green" | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dynamic Game State Variables
  const [isManual, setIsManual] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highscore, setHighscore] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Core Animation References
  const snakeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rawFetchedGridRef = useRef<ContributionDay[][]>([]);
  
  // Direction References to prevent state delays inside listeners
  const currentDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const nextDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize cookies highscore load values
  useEffect(() => {
    const savedHighScore = getCookie("abyndotxyz_snake_highscore");
    if (savedHighScore) setHighscore(parseInt(savedHighScore, 10));
  }, []);

  // Sync highscores
  useEffect(() => {
    if (score > highscore) {
      setHighscore(score);
      setCookie("abyndotxyz_snake_highscore", score.toString());
    }
  }, [score, highscore]);

  useEffect(() => {
    // Fetch contribution grid data
    fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`)
      .then((r) => r.json())
      .then((data) => {
        const contributions: ContributionDay[] = data.contributions || [];
        const grid: ContributionDay[][] = [];
        let weekArr: ContributionDay[] = [];

        contributions.forEach((day) => {
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

        const last24 = grid.slice(-COLS);
        setWeeks(last24);
        rawFetchedGridRef.current = last24;
        setLoading(false);

        // Wait 3 seconds on page load before spawning AI pathfinder
        snakeTimeoutRef.current = setTimeout(() => {
          startSnakeGame(last24, 1, 0, false);
        }, 3000);
      })
      .catch(() => setLoading(false));

    return () => stopEngine();
  }, []);

  // Keyboard Event Controllers
  useEffect(() => {
    if (!isManual) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const current = currentDirRef.current;
      let targetDir = { ...nextDirRef.current };

      switch (e.key) {
        case "w":
        case "W":
        case "ArrowUp":
          if (current.y === 0) targetDir = { x: 0, y: -1 };
          break;
        case "s":
        case "S":
        case "ArrowDown":
          if (current.y === 0) targetDir = { x: 0, y: 1 };
          break;
        case "a":
        case "A":
        case "ArrowLeft":
          if (current.x === 0) targetDir = { x: -1, y: 0 };
          break;
        case "d":
        case "D":
        case "ArrowRight":
          if (current.x === 0) targetDir = { x: 1, y: 0 };
          break;
        default:
          return;
      }
      nextDirRef.current = targetDir;
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isManual]);

  const stopEngine = () => {
    if (snakeIntervalRef.current) clearInterval(snakeIntervalRef.current);
    if (snakeTimeoutRef.current) clearTimeout(snakeTimeoutRef.current);
  };

  // --- Procedural Map Builder for Advanced Arcade Levels ---
  const generateProceduralLevel = (nextLevel: number): ContributionDay[][] => {
    const proceduralGrid: ContributionDay[][] = Array.from({ length: COLS }, () =>
      Array.from({ length: ROWS }, () => ({ count: 0, date: "Procedural Arena" }))
    );

    // Spawn green targets (Food modules)
    const foodCount = 6 + Math.floor(Math.random() * 5);
    let scatteredFood = 0;
    while (scatteredFood < foodCount) {
      const rx = Math.floor(Math.random() * COLS);
      const ry = Math.floor(Math.random() * ROWS);
      if (proceduralGrid[rx][ry].count === 0 && !(rx === 0 && ry === Math.floor(ROWS / 2))) {
        proceduralGrid[rx][ry].count = 1 + Math.floor(Math.random() * 11);
        scatteredFood++;
      }
    }

    // Spawn red modules (Obstacles scale dynamically based on level depth)
    const obstacleCount = (nextLevel - 1) * 3;
    let scatteredObstacles = 0;
    while (scatteredObstacles < obstacleCount) {
      const rx = Math.floor(Math.random() * COLS);
      const ry = Math.floor(Math.random() * ROWS);
      if (proceduralGrid[rx][ry].count === 0 && !proceduralGrid[rx][ry].isObstacle && !(rx === 0 && ry === Math.floor(ROWS / 2))) {
        proceduralGrid[rx][ry].isObstacle = true;
        scatteredObstacles++;
      }
    }

    return proceduralGrid;
  };

  // --- Main Engine Activation Initialization ---
  const startSnakeGame = (
    activeGrid: ContributionDay[][],
    currentLevel: number,
    startingScore: number,
    manualControlActive: boolean
  ) => {
    stopEngine();
    setIsManual(manualControlActive);
    setLevel(currentLevel);
    setScore(startingScore);

    let pos = { x: 0, y: Math.floor(ROWS / 2) };
    let dir = { x: 1, y: 0 };
    currentDirRef.current = dir;
    nextDirRef.current = dir;

    let path = [{ ...pos }];
    let tailLengthMax = 3;
    
    const localEaten = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;
    const isValid = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS;

    // Calculate total edible cells on current map layout
    let totalTargetFoodCells = 0;
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (activeGrid[x]?.[y] && activeGrid[x][y].count > 0) totalTargetFoodCells++;
      }
    }

    const tick = () => {
      if (manualControlActive) {
        // Manual User Control Input System
        dir = nextDirRef.current;
        currentDirRef.current = dir;
        pos = { x: pos.x + dir.x, y: pos.y + dir.y };
      } else {
        // AI Pathfinding Routine
        let target: { x: number; y: number } | null = null;
        let minDist = Infinity;

        for (let x = 0; x < COLS; x++) {
          for (let y = 0; y < ROWS; y++) {
            if (activeGrid[x]?.[y] && activeGrid[x][y].count > 0 && !localEaten.has(key(x, y))) {
              const dist = Math.abs(x - pos.x) + Math.abs(y - pos.y);
              if (dist < minDist) {
                minDist = dist;
                target = { x, y };
              }
            }
          }
        }

        const variants = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ].filter((d) => isValid(pos.x + d.x, pos.y + d.y));

        if (variants.length === 0) {
          triggerResetSequence(activeGrid, currentLevel, startingScore, manualControlActive, "red");
          return;
        }

        const activeBody = path.slice(-tailLengthMax);
        let safeMoves = variants.filter((d) => {
          const nx = pos.x + d.x;
          const ny = pos.y + d.y;
          return !activeBody.some((b) => b.x === nx && b.y === ny);
        });

        if (safeMoves.length === 0) safeMoves = variants; // Safety clip override

        if (target) {
          safeMoves.sort((a, b) => {
            const distA = Math.abs(pos.x + a.x - target!.x) + Math.abs(pos.y + a.y - target!.y);
            const distB = Math.abs(pos.x + b.x - target!.x) + Math.abs(pos.y + b.y - target!.y);
            return distA - distB;
          });
          dir = safeMoves[0];
        } else {
          const forwardMove = safeMoves.find((m) => m.x === dir.x && m.y === dir.y);
          dir = forwardMove || safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        pos = { x: pos.x + dir.x, y: pos.y + dir.y };
      }

      // COLLISION SYSTEMS: Validate matrix edge boundaries or dynamic tracking overlaps
      if (!isValid(pos.x, pos.y)) {
        triggerResetSequence(activeGrid, currentLevel, startingScore, manualControlActive, "red");
        return;
      }

      const activeBody = path.slice(-tailLengthMax);
      const cellNode = activeGrid[pos.x]?.[pos.y];

      if (activeBody.some((b) => b.x === pos.x && b.y === pos.y) || cellNode?.isObstacle) {
        triggerResetSequence(activeGrid, currentLevel, startingScore, manualControlActive, "red");
        return;
      }

      // Check for consumption
      if (cellNode && cellNode.count > 0 && !localEaten.has(key(pos.x, pos.y))) {
        localEaten.add(key(pos.x, pos.y));
        tailLengthMax = 3 + localEaten.size; // Grow tail longer when a cell is eaten
        setEatenPositions(new Set(localEaten));
        setScore((prev) => prev + 1);
      }

      path = [...path, { ...pos }].slice(-tailLengthMax);
      setSnake([...path]);

      // LEVEL SUCCESS TRIGGER: Advanced block compilation routine runs once maps are entirely cleared
      if (localEaten.size >= totalTargetFoodCells && totalTargetFoodCells > 0) {
        triggerResetSequence(activeGrid, currentLevel, startingScore + localEaten.size, manualControlActive, "green");
      }
    };

    const triggerResetSequence = (
      currentMap: ContributionDay[][],
      lvl: number,
      scr: number,
      isUserControlled: boolean,
      status: "red" | "green"
    ) => {
      stopEngine();
      setFlashStatus(status);

      snakeTimeoutRef.current = setTimeout(() => {
        setFlashStatus(null);
        setSnake([]);
        setEatenPositions(new Set());

        if (status === "red") {
          // Failure Mode: Revert back to Level 1 and swap back into auto-AI view layout
          const resetGrid = rawFetchedGridRef.current;
          setWeeks(resetGrid);
          startSnakeGame(resetGrid, 1, 0, false);
        } else {
          // Success Mode: Advance level and build out custom map loops
          const nextLevel = lvl + 1;
          const proceduralGrid = generateProceduralLevel(nextLevel);
          setWeeks(proceduralGrid);
          startSnakeGame(proceduralGrid, nextLevel, scr, isUserControlled);
        }
      }, 3000); // 3 second transition flash lock
    };

    snakeIntervalRef.current = setInterval(tick, manualControlActive ? 140 : 110);
  };

  // Mobile Touch Swiping Trackers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isManual) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isManual || !touchStartRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const current = currentDirRef.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 30) { // Threshold check
        if (diffX > 0 && current.x === 0) nextDirRef.current = { x: 1, y: 0 };
        else if (diffX < 0 && current.x === 0) nextDirRef.current = { x: -1, y: 0 };
        touchStartRef.current = null;
      }
    } else {
      if (Math.abs(diffY) > 30) {
        if (diffY > 0 && current.y === 0) nextDirRef.current = { x: 0, y: 1 };
        else if (diffY < 0 && current.y === 0) nextDirRef.current = { x: 0, y: -1 };
        touchStartRef.current = null;
      }
    }
  };

  const triggerManualActivationToggle = () => {
    stopEngine();
    setSnake([]);
    setEatenPositions(new Set());
    setFlashStatus(null);
    
    if (!isManual) {
      // Re-initialize Level 1 matrix instantly into manual mode loop
      const initialGrid = rawFetchedGridRef.current;
      setWeeks(initialGrid);
      startSnakeGame(initialGrid, 1, 0, true);
    } else {
      // Revert back into passive AI cycle loop
      const initialGrid = rawFetchedGridRef.current;
      setWeeks(initialGrid);
      startSnakeGame(initialGrid, 1, 0, false);
    }
  };

  const getColor = (day: ContributionDay, isEaten: boolean) => {
    if (day.isObstacle) return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] z-10 animate-pulse";
    if (day.count === 0 || isEaten) return "bg-zinc-200 dark:bg-zinc-800/60 transition-all duration-300";
    if (day.count <= 2) return "bg-emerald-200 dark:bg-emerald-950/60";
    if (day.count <= 5) return "bg-emerald-300 dark:bg-emerald-800/60";
    if (day.count <= 10) return "bg-emerald-400 dark:bg-emerald-600/70";
    return "bg-emerald-500 dark:bg-emerald-400/80";
  };

  if (loading) {
    return <div className="h-28 w-full skeleton-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800/50" />;
  }

  return (
    <div className="mt-1">
      {/* Stats Header Bar — Custom Arcade Mapping Context */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Score: <strong className="text-[var(--text-primary)]">{score}</strong>
          </span>
          <span>
            Level: <strong className="text-emerald-600 dark:text-emerald-400">{level}</strong>
          </span>
          <span>
            Highscore: <strong className="text-violet-600 dark:text-violet-400 font-medium">{highscore}</strong>
          </span>
        </div>
        
        {/* Play Controller Interface Button */}
        <button
          type="button"
          onClick={triggerManualActivationToggle}
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-all border ${
            isManual 
              ? "bg-violet-600 border-violet-700 text-white shadow-sm" 
              : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[var(--text-primary)] border-[var(--card-border)]"
          }`}
        >
          <Gamepad2 className="h-3 w-3" />
          <span>{isManual ? "Playing" : "Play"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Map Window Container */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={`overflow-x-auto pb-2 rounded-xl p-2 transition-all duration-300 select-none ${
            flashStatus === "red" ? "bg-red-500/10 dark:bg-red-500/20 ring-2 ring-red-500/50 animate-pulse" :
            flashStatus === "green" ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/50 animate-pulse" : ""
          }`}
        >
          <div className="flex gap-[3px] min-w-max justify-between">
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
                        if (day.count === 0 || isEaten || day.isObstacle) return;
                        setTooltip({
                          count: day.count,
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
                            ? "bg-zinc-950 dark:bg-zinc-50 scale-125 shadow-md z-20 animate-bounce"
                            : "bg-violet-500/80 dark:bg-violet-400/80"
                          : getColor(day, isEaten)
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Hover Context Card Windows */}
      {tooltip && !isManual && (
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
          <span className="opacity-90 font-medium text-zinc-300">{tooltip.date}</span>
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

        {/* Content Showcase Window */}
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
