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
    <div className="flex items-center gap-3">
      <div
        className="inline-flex items-center gap-2 rounded-full px-2.5 py-1"
        style={{
          background: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
          border: '1px solid var(--card-border)',
        }}
      >
        {/* Active visitors */}
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
          </span>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">{data.active}</span>
        </div>

        <div className="w-px h-3" style={{ backgroundColor: 'var(--border-color)' }} />

        {/* Page views */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">{data.pageviews}</span>
        </div>

        <div className="w-px h-3" style={{ backgroundColor: 'var(--border-color)' }} />

        {/* Unique visitors */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium text-[var(--text-secondary)]">{data.uniques}</span>
        </div>
      </div>
    </div>
  );
};

export default VisitorStats;