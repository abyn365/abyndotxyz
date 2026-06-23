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
    <div className="flex items-center gap-4">
      {/* Active visitors */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">{data.active} online</span>
      </div>

      <div className="h-3 w-px bg-[var(--border-color)]" />

      {/* Page views */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3 h-3 text-[var(--text-secondary)] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">{data.pageviews.toLocaleString()} views</span>
      </div>
    </div>
  );
};

export default VisitorStats;