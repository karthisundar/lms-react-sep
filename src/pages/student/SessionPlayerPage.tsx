import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Info, ShieldCheck } from 'lucide-react';
import { api } from '@/services';
import type { Session, Video } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import { Spinner, ErrorBanner, StatusBadge } from '@/components/ui';

export default function SessionPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([api.student.session(id), api.student.videoForSession(id)])
      .then(([s, v]) => {
        if (!active) return;
        setSession(s);
        setVideo(v);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load session'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner label="Loading session…" />;
  if (error) return (
    <div>
      <ErrorBanner message={error} />
      <button onClick={() => navigate('/sessions')} className="btn-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </button>
    </div>
  );

  const playbackUrl = video?.signedUrl ?? video?.url ?? '';

  return (
    <div className="max-w-5xl">
      <button
        onClick={() => navigate('/sessions')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sessions
      </button>

      {playbackUrl && user && (
        <VideoPlayer src={playbackUrl} watermarkText={`${user.name} • ${user.email}`} />
      )}

      {session && (
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-3">
            <StatusBadge status={session.status} />
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar className="h-4 w-4" />
              {new Date(session.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{session.name}</h1>
          {session.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">{session.description}</p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Protected content</p>
          <p className="mt-0.5 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Recordings are streamed via signed URLs. Downloading, right-click, and screen-capture shortcuts are disabled where the browser allows.
          </p>
        </div>
      </div>
    </div>
  );
}
