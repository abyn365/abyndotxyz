import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';

type Stats = {
  active: number;
  pageviews: number;
  uniques: number;
};

const VisitorStats = () => {
  const { data, error } = useSWR<Stats>('/api/visitor-stats', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });

  if (error || !data) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
      <span className="flex items-center gap-1 font-bold text-green-500">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        {data.active.toLocaleString()} active
      </span>
      <span className="mx-1" style={{ color: "var(--card-border)" }}>·</span>
      <span>{data.pageviews.toLocaleString()} views</span>
      <span className="mx-1" style={{ color: "var(--card-border)" }}>·</span>
      <span>{data.uniques.toLocaleString()} visitors</span>
    </div>
  );
};

export default VisitorStats;