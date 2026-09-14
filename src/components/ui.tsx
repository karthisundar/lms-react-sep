import type { ReactNode } from 'react';
import { Loader as Loader2 } from 'lucide-react';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <Loader2 className="h-8 w-8 animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
      <span className="font-medium">Error:</span> {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`badge ${map[normalized] ?? map.archived}`}>{status}</span>;
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-gray-300 dark:text-gray-600">{icon}</div>}
      <p className="text-base font-medium text-gray-600 dark:text-gray-300">{title}</p>
      {description && <p className="max-w-sm text-sm text-gray-400">{description}</p>}
    </div>
  );
}
