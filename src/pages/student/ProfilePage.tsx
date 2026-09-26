import { useEffect, useState } from 'react';
import { Calendar, Mail, ShieldCheck, User as UserIcon, Clock, Phone, Hash } from 'lucide-react';
import { api } from '@/services';
import type { User } from '@/types/api';
import { PageHeader, Spinner, ErrorBanner } from '@/components/ui';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.profile
      .get()
      .then((u) => active && setUser(u))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load profile'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading profile…" />;
  if (error) return <ErrorBanner message={error} />;
  if (!user) return <ErrorBanner message="Profile not found" />;

  const displayPhone = user.phoneNumber || user.phone_number || '';
  const displayUserRefId = user.user_ref_id || (user.id && user.id.includes('-') ? user.id : '');

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details (read-only)." />

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-white px-6 py-6 dark:border-gray-800 dark:from-brand-900/20 dark:to-gray-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-px bg-gray-200 sm:grid-cols-2 dark:bg-gray-800">
          <InfoRow icon={UserIcon} label="Full name" value={user.name} />
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow
            icon={ShieldCheck}
            label="Role"
            value={<span className="capitalize badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{user.role}</span>}
          />
          {displayPhone && (
            <InfoRow icon={Phone} label="Phone number" value={displayPhone} />
          )}
          {displayUserRefId && (
            <InfoRow icon={Hash} label="User Reference ID" value={<span className="font-mono text-xs">{displayUserRefId}</span>} />
          )}
          {user.createdAt && (
            <InfoRow icon={Calendar} label="Member since" value={new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
          )}
        </dl>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This is a read-only view. To update your details, please contact your administrator.</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-white px-6 py-4 dark:bg-gray-900">
      <Icon className="h-5 w-5 shrink-0 text-gray-400" />
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
      </div>
    </div>
  );
}
