import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CirclePlay as PlayCircle, Database, Film, Link2, Users, CircleUser as UserCircle, X } from 'lucide-react';
import type { Role } from '@/types/api';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/sessions', label: 'Sessions', icon: PlayCircle },
  { to: '/admin/buckets', label: 'Buckets', icon: Database },
  { to: '/admin/videos', label: 'Videos', icon: Film },
  { to: '/admin/mappings', label: 'Mappings', icon: Link2 },
];

const studentNav: NavItem[] = [
  { to: '/sessions', label: 'My Sessions', icon: PlayCircle },
  { to: '/mappings', label: 'Mappings', icon: Link2 },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, open, onClose }: SidebarProps) {
  const items = role === 'admin' ? adminNav : studentNav;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 dark:border-gray-800 dark:bg-gray-950 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 lg:hidden">
          <span className="text-sm font-semibold text-gray-500">Menu</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {role === 'admin' ? 'Administration' : 'Student'}
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
