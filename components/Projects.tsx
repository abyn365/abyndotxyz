import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, FolderOpen, Activity } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { projects as featuredProjects, type Project } from "../data/projects";
import ProjectCard from "./ProjectCard";

const PER_PAGE = 6;
const ROWS = 7;
const COLS = 24;
const USERNAME = "abyn365";

// --- Types for GitHub Graph ---
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

function formatEvent(event: any) {
  const repo = event.repo?.name?.split("/")[1] || event.repo?.name;
  switch (event.type) {
    case "PushEvent":
      return {
        icon: "⬆",
        text: event.displayMessage || `pushed to ${repo}`,
        repo: event.repo?.name,
      };
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

// --- Sub-Component: GitHub Graph & Interactive Arcade Engine ---
function GitHubGraph() {
  const [weeks, setWeeks] = useState<ContributionDay[][]>([]);
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [eatenPositions, setEatenPositions] = useState<Set<string>>(new Set());
  const [flashStatus, setFlashStatus] = useState<"red" | "green" | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCommits, setTotalCommits] = useState(0);
  const [weekCommits, setWeekCommits] = useState(0);
  const [topRepo, setTopRepo] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  
  // Easter Egg Game State Variables
  const [isManual, setIsManual] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highscore, setHighscore] = useState(0);

  const snakeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rawFetchedGridRef = useRef<ContributionDay[][]>([]);
  
  const currentDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const nextDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });

  // Load cookies highscore context tokens on mount
  useEffect(() => {
    const savedHighScore = getCookie("abyndotxyz_snake_highscore");
    if (savedHighScore) setHighscore(parseInt(savedHighScore, 10));
  }, []);

  // Synchronize highscores dynamically
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

        const last24 = grid.slice(-COLS);
        setWeeks(last24);
        rawFetchedGridRef.current = last24;
        setLoading(false);

        // Wait 3 seconds on initial page load before activating auto-pilot snake loop
        snakeTimeoutRef.current = setTimeout(() => {
          startSnakeGame(last24, 1, 0, false);
        }, 3000);
      })
      .catch(() => setLoading(false));

    // Fetch repository arrays and accurately sort to solve top starred tracker
    fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`)
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

    // Consume custom server-side endpoint with integrated KV caching loops
    fetch(`/api/github-events`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.events) setEvents(data.events);
      })
      .catch(() => {});

    return () => stopSnake();
  }, []);

  // Keyboard Controller Event Bindings
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

  const stopSnake = () => {
    if (snakeIntervalRef.current) clearInterval(snakeIntervalRef.current);
    if (snakeTimeoutRef.current) clearTimeout(snakeTimeoutRef.current);
  };

  // --- Procedural Generation Logic for Custom Levels ---
  const generateProceduralLevel = (nextLevel: number): ContributionDay[][] => {
    const proceduralGrid: ContributionDay[][] = Array.from({ length: COLS }, () =>
      Array.from({ length: ROWS }, () => ({ count: 0, date: "Arcade Arena" }))
    );

    // Spawn green target cells (Food items)
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

    // Spawn red mine hazards (Obstacles multiply based on current level)
    const obstacleCount = (nextLevel - 1) * 3;
    let scatteredObstacles = 0;
    while (scatteredObstacles < obstacleCount) {
      const rx = Math.floor(Math.random() * COLS);
      const ry = Math.floor(Math.random() * ROWS);
      if (
        proceduralGrid[rx][ry].count === 0 && 
        !proceduralGrid[rx][ry].isObstacle && 
        !(rx === 0 && ry === Math.floor(ROWS / 2))
      ) {
        proceduralGrid[rx][ry].isObstacle = true;
        scatteredObstacles++;
      }
    }

    return proceduralGrid;
  };

  // --- Main Snake Game Loop Engine ---
  const startSnakeGame = (
    activeGrid: ContributionDay[][],
    currentLevel: number,
    startingScore: number,
    manualControlActive: boolean
  ) => {
    stopSnake();
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

    let totalTargetFoodCells = 0;
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        if (activeGrid[x]?.[y] && activeGrid[x][y].count > 0) totalTargetFoodCells++;
      }
    }

    const tick = () => {
      if (manualControlActive) {
        dir = nextDirRef.current;
        currentDirRef.current = dir;
      } else {
        // AI Pathfinder Algorithm Routine
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

        const directions = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];

        const activeBody = path.slice(-tailLengthMax);
        let safeMoves = directions.filter((d) => {
          let nx = (pos.x + d.x + COLS) % COLS;
          let ny = (pos.y + d.y + ROWS) % ROWS;
          return !activeBody.some((b) => b.x === nx && b.y === ny);
        });

        if (safeMoves.length === 0) safeMoves = directions;

        if (target) {
          safeMoves.sort((a, b) => {
            let nextAx = (pos.x + a.x + COLS) % COLS;
            let nextAy = (pos.y + a.y + ROWS) % ROWS;
            let nextBx = (pos.x + b.x + COLS) % COLS;
            let nextBy = (pos.y + b.y + ROWS) % ROWS;

            const distA = Math.abs(nextAx - target!.x) + Math.abs(nextAy - target!.y);
            const distB = Math.abs(nextBx - target!.x) + Math.abs(nextBy - target!.y);
            return distA - distB;
          });
          dir = safeMoves[0];
        } else {
          const forwardMove = safeMoves.find((m) => m.x === dir.x && m.y === dir.y);
          dir = forwardMove || safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }
      }

      // Toroidal Edge Wrap
      let nextX = (pos.x + dir.x + COLS) % COLS;
      let nextY = (pos.y + dir.y + ROWS) % ROWS;
      pos = { x: nextX, y: nextY };

      const activeBody = path.slice(-tailLengthMax);
      const cellNode = activeGrid[pos.x]?.[pos.y];

      // Collision checks
      if (activeBody.some((b) => b.x === pos.x && b.y === pos.y) || cellNode?.isObstacle) {
        triggerResetSequence(activeGrid, currentLevel, startingScore, manualControlActive, "red");
        return;
      }

      // Digestion process
      if (cellNode && cellNode.count > 0 && !localEaten.has(key(pos.x, pos.y))) {
        localEaten.add(key(pos.x, pos.y));
        tailLengthMax = 3 + localEaten.size;
        setEatenPositions(new Set(localEaten));
        setScore((prev) => prev + 1);
      }

      path = [...path, { ...pos }].slice(-tailLengthMax);
      setSnake([...path]);

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
      stopSnake();
      setFlashStatus(status);

      // Flash animation holds for 2 seconds
      snakeTimeoutRef.current = setTimeout(() => {
        setFlashStatus(null);
        setSnake([]);
        setEatenPositions(new Set());

        if (status === "red") {
          const resetGrid = rawFetchedGridRef.current;
          setWeeks(resetGrid);
          
          snakeTimeoutRef.current = setTimeout(() => {
            startSnakeGame(resetGrid, 1, 0, false);
          }, 3000);
        } else {
          const nextLevel = lvl + 1;
          const proceduralGrid = generateProceduralLevel(nextLevel);
          setWeeks(proceduralGrid);
          
          snakeTimeoutRef.current = setTimeout(() => {
            startSnakeGame(proceduralGrid, nextLevel, scr, isUserControlled);
          }, 3000);
        }
      }, 2000);
    };

    const currentIntervalSpeed = manualControlActive ? Math.max(70, 200 - (currentLevel - 1) * 25) : 110;
    snakeIntervalRef.current = setInterval(tick, currentIntervalSpeed);
  };

  const toggleManualActivationMode = () => {
    stopSnake();
    setSnake([]);
    setEatenPositions(new Set());
    setFlashStatus(null);

    const baseMapGrid = rawFetchedGridRef.current;
    setWeeks(baseMapGrid);
    startSnakeGame(baseMapGrid, 1, 0, !isManual);
  };

  const getColor = (day: ContributionDay, isEaten: boolean) => {
    if (day.isObstacle) return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] z-10 animate-pulse";
    if (day.count === 0 || isEaten) return "bg-zinc-200 dark:bg-zinc-800/60 transition-all duration-300";
    if (day.count <= 2) return "bg-emerald-200 dark:bg-emerald-950/60";
    if (day.count <= 5) return "bg-emerald-300 dark:bg-emerald-800/60";
    if (day.count <= 10) return "bg-emerald-400 dark:bg-emerald-600/70";
    return "bg-emerald-500 dark:bg-emerald-400/80";
  };

  const isRightSideEdge = typeof window !== "undefined" && tooltip && tooltip.x > window.innerWidth - 160;

  return (
    <div className="mt-1">
      {/* Header Metric Line */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {isManual ? (
            <>
              <span>
                Score: <strong className="text-[var(--text-primary)]">{score}</strong>
              </span>
              <span>
                Level: <strong className="text-emerald-600 dark:text-emerald-400">{level}</strong>
              </span>
              <span>
                Highscore: <strong className="text-violet-600 dark:text-violet-400 font-medium">{highscore}</strong>
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <button
          type="button"
          onClick={toggleManualActivationMode}
          className="text-[10px] uppercase tracking-wider font-sans font-bold opacity-45 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer select-none text-[var(--text-primary)]"
        >
          <span>{isManual ? "[ Exit ]" : "[ Play ]"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matrix Scrolling Window */}
        <div className="overflow-x-auto pb-2 lg:col-span-2 select-none">
          <div 
            className={`inline-flex gap-[2px] sm:gap-[3px] min-w-max justify-center lg:justify-start rounded-xl p-2 transition-all duration-300 ${
              flashStatus === "red" ? "bg-red-500/10 dark:bg-red-500/20 ring-2 ring-red-500/50 animate-pulse" :
              flashStatus === "green" ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/50 animate-pulse" : ""
            }`}
          >
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[2px] sm:gap-[3px]">
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
                      className={`w-[9px] h-[9px] sm:w-[13px] sm:h-[13px] rounded-[1.5px] sm:rounded-[2px] transition-all duration-150 ${
                        isSnake
                          ? isHead
                            ? "bg-zinc-950 dark:bg-zinc-50 scale-125 shadow-md z-10 animate-bounce"
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

        {/* RIGHT SIDE PANEL */}
        <div className="min-w-0">
          {isManual ? (
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-[var(--card-border)] rounded-xl bg-zinc-100/40 dark:bg-zinc-900/30 min-h-[140px] relative select-none">
              <span className="absolute top-2 left-3 font-mono text-[9px] uppercase opacity-35 tracking-wider">Tactile Mobile D-Pad Control</span>
              <div className="grid grid-cols-3 gap-2.5 w-32 h-32 items-center justify-center text-center font-mono select-none">
                <div />
                <button 
                  type="button"
                  onClick={() => { if (currentDirRef.current.y === 0) nextDirRef.current = { x: 0, y: -1 }; }}
                  className="w-9 h-9 flex items-center justify-center rounded border border-[var(--card-border)] bg-[#FFFFFDFA] dark:bg-zinc-800 active:bg-violet-500 active:text-white transition-colors cursor-pointer text-sm font-bold shadow-sm"
                >
                  ⬆
                </button>
                <div />
                
                <button 
                  type="button"
                  onClick={() => { if (currentDirRef.current.x === 0) nextDirRef.current = { x: -1, y: 0 }; }}
                  className="w-9 h-9 flex items-center justify-center rounded border border-[var(--card-border)] bg-[#FFFFFDFA] dark:bg-zinc-800 active:bg-violet-500 active:text-white transition-colors cursor-pointer text-sm font-bold shadow-sm"
                >
                  ⬅
                </button>
                <div className="text-zinc-400 dark:text-zinc-600 text-[10px] font-sans font-bold uppercase tracking-widest">Pad</div>
                <button 
                  type="button"
                  onClick={() => { if (currentDirRef.current.x === 0) nextDirRef.current = { x: 1, y: 0 }; }}
                  className="w-9 h-9 flex items-center justify-center rounded border border-[var(--card-border)] bg-[#FFFFFDFA] dark:bg-zinc-800 active:bg-violet-500 active:text-white transition-colors cursor-pointer text-sm font-bold shadow-sm"
                >
                  ➡
                </button>
                
                <div />
                <button 
                  type="button"
                  onClick={() => { if (currentDirRef.current.y === 0) nextDirRef.current = { x: 0, y: 1 }; }}
                  className="w-9 h-9 flex items-center justify-center rounded border border-[var(--card-border)] bg-[#FFFFFDFA] dark:bg-zinc-800 active:bg-violet-500 active:text-white transition-colors cursor-pointer text-sm font-bold shadow-sm"
                >
                  ⬇
                </button>
                <div />
              </div>
            </div>
          ) : (
            events.length > 0 && (
              <div className="space-y-2 border-t border-dashed border-[var(--card-border)] pt-4 lg:border-t-0 lg:pt-0">
                {events
                  .filter((e) => Date.now() - new Date(e.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
                  .map((e, i) => {
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
            )
          )}
        </div>
      </div>

      {/* Floating Hover Context Cards */}
      {tooltip && !isManual && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg border text-[11px] shadow-xl pointer-events-none font-sans backdrop-blur-sm"
          style={{
            borderColor: "var(--card-border)",
            background: "rgba(15, 15, 15, 0.92)",
            color: "#fff",
            left: isRightSideEdge ? tooltip.x - 145 : tooltip.x + 12,
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
