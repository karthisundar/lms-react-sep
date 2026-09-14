import { useAuth } from '@/context/AuthContext';
import AdminSessionsPage from '@/pages/admin/AdminSessionsPage';
import MySessionsPage from '@/pages/student/MySessionsPage';

export default function SessionsRoutingPage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminSessionsPage />;
  }

  return <MySessionsPage />;
}
