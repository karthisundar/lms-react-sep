import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (sessionStorage.getItem('just_logged_out') === 'true') {
      sessionStorage.removeItem('just_logged_out');
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/sessions'} replace />;
  }

  return <>{children}</>;
}
