import { useEffect, useState } from 'react';

type Stats = {
  active: number;
  pageviews: number;
  uniques: number;
};

const VisitorStats = () => {
  const [stats, setStats] = useState<Stats>({ active: 0, pageviews: 0, uniques: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/visitor-stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
        setError(false);
      } catch (error) {
        console.error('Error fetching visitor stats:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh more frequently for active users
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error || loading) return null;

  return (
    <div className="absolute -top-2 -right-2 flex items-center gap-2">
      <div className="bg-zinc-900/90 rounded-full px-2 py-1 border border-zinc-800/50 flex items-center gap-1.5">
        {/* Active visitors */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-zinc-300">{stats.active}</span>
        </div>

        <div className="w-px h-3 bg-zinc-700/50" />

        {/* Page views */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-[10px] text-zinc-300">{stats.pageviews}</span>
        </div>

        <div className="w-px h-3 bg-zinc-700/50" />

        {/* Unique visitors */}
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] text-zinc-300">{stats.uniques}</span>
        </div>
      </div>
    </div>
  );
};

export default VisitorStats;