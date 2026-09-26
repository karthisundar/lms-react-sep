import { type ReactNode, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows?: T[];
  data?: T[];
  total: number;
  totalPages?: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  rowKey?: (row: T) => string;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

export default function DataTable<T>({
  columns,
  rows,
  data,
  total,
  totalPages,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  onSearchChange,
  searchValue = '',
  rowKey,
  emptyMessage = 'No records found.',
  actions,
}: DataTableProps<T>) {
  const tableRows = rows ?? data ?? [];
  const getRowKey =
    rowKey ??
    ((row: T) =>
      (row as any)?.id ??
      (row as any)?.lessonVideoMappingRefId ??
      (row as any)?.lessonRefId ??
      (row as any)?.userSessionRefId ??
      (row as any)?.key ??
      String(Math.random()));
  const [localSearch, setLocalSearch] = useState(searchValue);
  const calcTotalPages = totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (calcTotalPages <= 7) {
      for (let i = 1; i <= calcTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(calcTotalPages - 1, page + 1);
      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (page < calcTotalPages - 2) pages.push('...');
      if (!pages.includes(calcTotalPages)) pages.push(calcTotalPages);
    }
    return pages;
  }, [calcTotalPages, page]);

  const hasSearch = !!onSearchChange;

  const handleSearch = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const cols = useMemo(() => {
    const c = [...columns];
    if (actions) c.push({ key: '__actions', header: 'Actions', className: 'text-right' });
    return c;
  }, [columns, actions]);

  return (
    <div className="card overflow-hidden">
      {hasSearch && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search…"
              className="input pl-9"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && (
              <tr>
                <td colSpan={cols.length} className="px-4 py-10 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && tableRows.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-4 py-10 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              tableRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-gray-700 dark:text-gray-200 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">{actions(row)}</td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {total > 0 ? `Showing ${start}–${end} of ${total}` : 'No results'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-ghost h-8 px-2.5 text-xs font-medium"
              aria-label="Previous page"
            >
              <ChevronLeft className="mr-0.5 inline h-4 w-4" />
              Previous
            </button>

            {pageNumbers.map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition-colors ${
                    p === page
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ) : (
                <span key={`ellipsis-${idx}`} className="select-none px-1 text-xs text-gray-400">
                  …
                </span>
              )
            )}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= calcTotalPages}
              className="btn-ghost h-8 px-2.5 text-xs font-medium"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="ml-0.5 inline h-4 w-4" />
            </button>
          </div>

          {onPageSizeChange && (
            <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-gray-200 dark:sm:border-gray-800">
              <label htmlFor="pageSizeSelect" className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                Page Size:
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
