import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Code as Code2, Eye, EyeOff, LogIn, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/services';
import { demoCredentials } from '@/services/demoApi';
import { HttpError } from '@/services/api';
import type { ApiErrorResponse } from '@/types/api';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fetch client labels on mount so error/success messages can be resolved dynamically
  useEffect(() => {
    api.auth.fetchClientLabels?.().catch(() => {
      // Non-blocking prefetch failure
    });
  }, []);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate API requests

    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        password: btoa(password),
      };

      const user = await login(payload.email, payload.password);
      navigate(user.role === 'admin' ? '/admin' : '/sessions', { replace: true });
    } catch (err: unknown) {
      let friendlyMessage = 'Unable to log in. Please check your credentials and try again.';

      if (err instanceof HttpError) {
        const errorData = err.data as ApiErrorResponse | undefined;
        const rawCode = errorData?.response?.code || err.code;
        const errorCode = Array.isArray(rawCode)
          ? rawCode[0]
          : typeof rawCode === 'string'
            ? rawCode
            : null;

        if (errorCode === 'USER_E_00001') {
          const clientLabelMsg = api.auth.getClientLabel?.('USER_E_00001');
          friendlyMessage = clientLabelMsg || 'User not found. Please check your credentials and try again.';
        } else if (errorCode) {
          const clientLabelMsg = api.auth.getClientLabel?.(errorCode);
          if (clientLabelMsg) {
            friendlyMessage = clientLabelMsg;
          } else if (err.status === 401 || err.status === 403) {
            friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
          }
        } else if (err.status === 401 || err.status === 403) {
          friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        }
      } else if (err instanceof Error) {
        if (err.message && !err.message.includes('stack') && !err.message.includes('Error:')) {
          friendlyMessage = err.message;
        }
      }

      setError(friendlyMessage);
    }
  };

  const fillDemo = (cred: { email: string; password: string; role: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-4 dark:bg-gray-950">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/20" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/10" />
      </div>

      {/* Top navigation with Home link */}
      <div className="absolute left-4 top-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          title="Back to Home"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </div>

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="group inline-flex flex-col items-center cursor-pointer focus:outline-none"
            title="Go to Home"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform group-hover:scale-105">
              <Code2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
              CodeClass
            </h1>
          </Link>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Online coding classes, on demand.</p>
        </div>

        <div className="card p-8 animate-scale-in">
          <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Sign in to access your classes.</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogIn className="h-4 w-4" />}
              Sign in
            </button>
          </form>

          {/* Form-level Home link */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>← Home</span>
            </Link>
          </div>

          {api.isDemoMode && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <p className="mb-2 text-xs font-medium text-gray-500">Demo accounts (password: <span className="font-mono">password</span>)</p>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((c) => (
                  <button
                    key={c.email}
                    onClick={() => fillDemo(c)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    {c.role === 'admin' ? <ShieldCheck className="h-4 w-4 text-brand-500" /> : <GraduationCap className="h-4 w-4 text-emerald-500" />}
                    <div>
                      <p className="font-medium capitalize text-gray-700 dark:text-gray-200">{c.role}</p>
                      <p className="truncate text-gray-400">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          No sign-up — accounts are managed by your administrator.
        </p>
      </div>
    </div>
  );
}
