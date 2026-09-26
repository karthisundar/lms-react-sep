import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.setItem('just_logged_out', 'true');
    navigate('/', { replace: true });
    logout();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onLogout={handleLogout} />

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-20 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm lg:hidden dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="lg:pl-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
