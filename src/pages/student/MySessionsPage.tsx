import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePlay as PlayCircle, Calendar, ArrowRight, Search, Eye } from 'lucide-react';
import { api } from '@/services';
import type { Session } from '@/types/api';
import { PageHeader, Spinner, ErrorBanner, StatusBadge, EmptyState } from '@/components/ui';

export default function MySessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.student
      .mySessions({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        pageSize,
      })
      .then((res) => {
        const rows = res.row || res.items || [];
        setSessions(rows);
        const extractedTotal = Number(res.totalItem ?? res.total ?? rows.length);
        setTotal(extractedTotal);
        setTotalPages(Number(res.totalPage ?? Math.max(1, Math.ceil(extractedTotal / pageSize))));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <PageHeader
        title="My Sessions"
        description="View your assigned class sessions and watch available videos."
      />

      {/* Filter and Search Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search assigned sessions…"
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-36 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <Spinner label="Loading your assigned sessions…" />}

      {!loading && !error && sessions.length === 0 && (
        <EmptyState
          title="No sessions found"
          description="When your administrator assigns you class sessions, they will appear here."
          icon={<PlayCircle className="h-12 w-12" />}
        />
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const refId = s.sessionRefId || s.id;
            const sName = s.sessionName || s.name;
            const sDate = s.startDate || s.date;

            return (
              <div
                key={refId}
                className="card group flex flex-col justify-between p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div
                    onClick={() => navigate(`/sessions/${refId}`)}
                    className="mb-4 flex h-36 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-indigo-800 text-white shadow-sm transition-transform group-hover:scale-[1.01]"
                  >
                    <PlayCircle className="h-14 w-14 opacity-90 transition-transform group-hover:scale-110" />
                  </div>

                  <div className="mb-2 flex items-center justify-between gap-2">
                    <StatusBadge status={s.status} />
                    {sDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(sDate)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 line-clamp-1 dark:text-white">
                    {sName}
                  </h3>

                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    onClick={() => navigate(`/sessions/${refId}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>

                  <button
                    onClick={() => navigate(`/sessions/${refId}`)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Watch Session{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination summary & buttons */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing Page {page} of {totalPages} ({total} sessions)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary py-1 text-xs"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary py-1 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
