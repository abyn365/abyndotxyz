export default function MusicTrackSkeleton({ index }: { index: number }) {
  return (
    <div
      className="grid items-center gap-3 rounded-xl px-3 py-2.5 opacity-60"
      style={{ gridTemplateColumns: "2rem 3.5rem 1fr auto" }}
    >
      <div className="ml-auto hidden h-3 w-6 animate-pulse rounded-sm bg-[var(--bg-secondary)] sm:block" />
      <div className="col-start-1 h-14 w-14 animate-pulse rounded-lg bg-[var(--bg-secondary)] sm:col-start-2" />
      <div className="space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded-sm bg-[var(--bg-secondary)]" />
        <div className="h-3 w-1/2 animate-pulse rounded-sm bg-[var(--bg-secondary)]" />
      </div>
      <div className="hidden h-3 w-10 animate-pulse rounded-sm bg-[var(--bg-secondary)] sm:block" />
    </div>
  );
}
