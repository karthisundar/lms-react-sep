import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CirclePlay as PlayCircle, Database, Film, Link2, Users, ArrowRight } from 'lucide-react';
import { api } from '@/services';
import { PageHeader, Spinner } from '@/components/ui';

interface Stats {
  sessions: number;
  buckets: number;
  videos: number;
  mappings: number;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.sessions.list({ page: 1, pageSize: 1 }),
      api.buckets.list({ page: 1, pageSize: 1 }),
      api.videos.list({ page: 1, pageSize: 1 }),
      api.mappings.list({ page: 1, pageSize: 1 }),
      api.users.list({ page: 1, pageSize: 1 }),
    ])
      .then(([s, b, v, m, u]) => {
        if (!active) return;
        setStats({
          sessions: s.total,
          buckets: b.total,
          videos: v.total,
          mappings: m.total,
          users: u.total,
        });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: 'Sessions', value: stats?.sessions, icon: PlayCircle, to: '/admin/sessions', color: 'brand' },
    { label: 'Buckets', value: stats?.buckets, icon: Database, to: '/admin/buckets', color: 'emerald' },
    { label: 'Videos', value: stats?.videos, icon: Film, to: '/admin/videos', color: 'amber' },
    { label: 'Mappings', value: stats?.mappings, icon: Link2, to: '/admin/mappings', color: 'rose' },
    { label: 'Users', value: stats?.users, icon: Users, to: '/admin/users', color: 'sky' },
  ];

  const colorMap: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your coding class platform." />

      {loading ? (
        <Spinner label="Loading stats…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {cards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[c.color]}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value ?? 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuickLink
              to="/admin/users"
              icon={Users}
              title="Manage Users"
              description="Create, edit, and organize user accounts."
            />
            <QuickLink
              to="/admin/sessions"
              icon={PlayCircle}
              title="Manage Sessions"
              description="Create, edit, and organize class sessions."
            />
            <QuickLink
              to="/admin/videos"
              icon={Film}
              title="Manage Videos"
              description="Upload video URLs and map them to sessions."
            />
            <QuickLink
              to="/admin/buckets"
              icon={Database}
              title="Manage Buckets"
              description="Configure storage providers for recordings."
            />
            <QuickLink
              to="/admin/mappings"
              icon={Link2}
              title="User-Session Mapping"
              description="Assign students to specific sessions."
            />
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, description }: { to: string; icon: typeof PlayCircle; title: string; description: string }) {
  return (
    <Link to={to} className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
