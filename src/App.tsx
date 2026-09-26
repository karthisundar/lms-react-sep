import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';

import HomePage from '@/pages/public/HomePage';
import AllCoursesPage from '@/pages/public/AllCoursesPage';
import CourseDetailPage from '@/pages/public/CourseDetailPage';

import ProfilePage from '@/pages/student/ProfilePage';
import SessionPlayerPage from '@/pages/student/SessionPlayerPage';
import SessionsRoutingPage from '@/pages/SessionsRoutingPage';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminCoursesPage from '@/pages/admin/AdminCoursesPage';
import AdminModulesPage from '@/pages/admin/AdminModulesPage';
import AdminLessonsPage from '@/pages/admin/AdminLessonsPage';
import AdminSessionsPage from '@/pages/admin/AdminSessionsPage';
import AdminBucketsPage from '@/pages/admin/AdminBucketsPage';
import AdminVideosPage from '@/pages/admin/AdminVideosPage';
import AdminMappingsPage from '@/pages/admin/AdminMappingsPage';
import AdminLessonVideoMappingsPage from '@/pages/admin/AdminLessonVideoMappingsPage';
import AdminLessonNotesPage from '@/pages/admin/AdminLessonNotesPage';
import AdminUserLessonMappingsPage from '@/pages/admin/AdminUserLessonMappingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Educational & LMS Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/courses" element={<AllCoursesPage />} />
            <Route path="/courses/:courseSlug" element={<CourseDetailPage />} />
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
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/modules" element={<AdminModulesPage />} />
              <Route path="/modules" element={<Navigate to="/admin/modules" replace />} />
              <Route path="/admin/lessons" element={<AdminLessonsPage />} />
              <Route path="/lessons" element={<Navigate to="/admin/lessons" replace />} />
              <Route path="/admin/lesson-video-mappings" element={<AdminLessonVideoMappingsPage />} />
              <Route path="/lesson-video-mappings" element={<Navigate to="/admin/lesson-video-mappings" replace />} />
              <Route path="/admin/lesson-notes" element={<AdminLessonNotesPage />} />
              <Route path="/lesson-notes" element={<Navigate to="/admin/lesson-notes" replace />} />
              <Route path="/admin/user-lesson-mappings" element={<AdminUserLessonMappingsPage />} />
              <Route path="/user-lesson-mappings" element={<Navigate to="/admin/user-lesson-mappings" replace />} />
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
