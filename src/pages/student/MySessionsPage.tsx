import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePlay as PlayCircle, Calendar, ArrowRight, Search } from 'lucide-react';
import { api } from '@/services';
import type { Session } from '@/types/api';
import { PageHeader, Spinner, ErrorBanner, StatusBadge, EmptyState } from '@/components/ui';

export default function MySessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.student
      .mySessions({ search: search || undefined, page: 1, pageSize: 100 })
      .then((res) => {
        setSessions(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="My Sessions" description="Recorded classes assigned to you." />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions…"
          className="input pl-9"
        />
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner label="Loading sessions…" />}
      {!loading && !error && sessions.length === 0 && (
        <EmptyState
          title="No sessions yet"
          description="When your administrator assigns you sessions, they'll appear here."
          icon={<PlayCircle className="h-12 w-12" />}
        />
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/sessions/${s.id}`)}
              className="card group p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <PlayCircle className="h-12 w-12 opacity-90 transition-transform group-hover:scale-110" />
              </div>
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge status={s.status} />
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                Watch now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && total > 0 && (
        <p className="mt-4 text-sm text-gray-400">{total} session{total !== 1 && 's'} assigned</p>
      )}
    </div>
  );
}
