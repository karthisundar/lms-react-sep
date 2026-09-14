import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';

import ProfilePage from '@/pages/student/ProfilePage';
import SessionPlayerPage from '@/pages/student/SessionPlayerPage';
import SessionsRoutingPage from '@/pages/SessionsRoutingPage';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminSessionsPage from '@/pages/admin/AdminSessionsPage';
import AdminBucketsPage from '@/pages/admin/AdminBucketsPage';
import AdminVideosPage from '@/pages/admin/AdminVideosPage';
import AdminMappingsPage from '@/pages/admin/AdminMappingsPage';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/sessions'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Shared routes: accessible to both admin and user */}
            <Route
              element={
                <ProtectedRoute roles={['admin', 'user']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/sessions" element={<SessionsRoutingPage />} />
              <Route path="/my-sessions" element={<Navigate to="/sessions" replace />} />
              <Route path="/sessions/:id" element={<SessionPlayerPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin-only routes */}
            <Route
              element={
                <ProtectedRoute roles={['admin']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/sessions" element={<AdminSessionsPage />} />
              <Route path="/sessions/create" element={<AdminSessionsPage initialMode="create" />} />
              <Route path="/sessions/edit/:id" element={<AdminSessionsPage initialMode="edit" />} />
              <Route path="/admin/buckets" element={<AdminBucketsPage />} />
              <Route path="/admin/videos" element={<AdminVideosPage />} />
              <Route path="/admin/mappings" element={<AdminMappingsPage />} />
              <Route path="/mappings" element={<AdminMappingsPage />} />
              <Route path="/mappings/create" element={<AdminMappingsPage initialMode="create" />} />
              <Route path="/mappings/edit/:id" element={<AdminMappingsPage initialMode="edit" />} />
              <Route path="/mappings/edit/:userSessionRefId" element={<AdminMappingsPage initialMode="edit" />} />
              <Route path="/user-session-mapping" element={<Navigate to="/mappings" replace />} />
            </Route>

            <Route path="/" element={<RoleRedirect />} />
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
