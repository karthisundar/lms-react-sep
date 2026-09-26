// src/components/public/PublicHeader.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code as Code2, Menu, X, ArrowRight, User as UserIcon, LayoutDashboard, CirclePlay as PlayCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Why Us', path: '/#benefits' },
    { name: 'Process', path: '/#process' },
    { name: 'Contact', path: '/#contact' },
  ];

  const handleNavClick = (path: string) => {
    if (path.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/' + path.substring(1));
      } else {
        const id = path.substring(2);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(path);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/90'
          : 'border-b border-transparent bg-white/70 backdrop-blur-sm dark:bg-gray-950/70'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30 transition-colors group-hover:bg-brand-700">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              CodeClass
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase text-brand-600 dark:text-brand-400">
              School of Tech & AI
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/' && !location.hash
                : item.path === '/courses'
                  ? location.pathname.startsWith('/courses')
                  : false;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-950/40'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions (ThemeToggle + Login / User Session) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <button
              type="button"
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/sessions')}
              className="btn-primary h-10 px-4 gap-2 text-sm font-semibold shadow-md shadow-brand-600/20"
            >
              {user.role === 'admin' ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  <span>My Sessions</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary h-10 px-5 text-sm font-semibold shadow-md shadow-brand-600/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Login</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile: Hamburger and Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-3 pb-6 shadow-xl dark:border-gray-800 dark:bg-gray-950 animate-fade-in">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span>{item.name}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : '/sessions')}
                  className="btn-primary w-full h-11 justify-center text-sm font-semibold shadow-sm"
                >
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Sessions'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full h-11 justify-center text-sm font-semibold shadow-md shadow-brand-600/25"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Login to CodeClass</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
