import { Code as Code2, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const { user,logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.setItem('just_logged_out', 'true');
    navigate('/', { replace: true });
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-gray-800 dark:bg-gray-950/80">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Code2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          CodeClass
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden items-center gap-2 rounded-lg px-3 py-1.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium leading-tight text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost h-9 px-2.5"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export function NavbarUserBadge() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <UserIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
    </div>
  );
}
