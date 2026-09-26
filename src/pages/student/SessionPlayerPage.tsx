import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CirclePlay as PlayCircle,
  Film,
  Info,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { sessionMasterService, videoService } from '@/services';
import type { Session, Video } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/VideoPlayer';
import { Spinner, ErrorBanner, StatusBadge, EmptyState } from '@/components/ui';

export default function SessionPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      sessionMasterService.getSession(id).catch(() => null),
      videoService
        .getAllVideos({ sessionId: id, sessionRefId: id, pageSize: 100 })
        .catch(() => null),
    ])
      .then(([s, vRes]) => {
        if (!active) return;
        if (!s) {
          setError('Session not found or unavailable.');
          return;
        }
        setSession(s);

        const rawList = vRes?.row || vRes?.items || [];
        const videoList = rawList.map((v: any) => ({
          ...v,
          videoRefId: String(v.videoRefId || v.video_ref_id || v.id || v.videoId || v.video_id || '').trim(),
        }));
        setVideos(videoList);

        // Default to first video if available
        if (videoList.length > 0) {
          setActiveVideo(videoList[0]);
        }
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load session details'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin/sessions');
    } else {
      navigate('/sessions');
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Spinner label="Loading session details & videos…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl space-y-4">
        <ErrorBanner message={error} />
        <button onClick={handleBack} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </button>
      </div>
    );
  }

  const sessionName = session?.sessionName || session?.name || 'Session Details';
  const sessionDate = session?.startDate || session?.date;
  const playbackUrl = activeVideo?.url || activeVideo?.signedUrl || '';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Navigation Header */}
      <div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </button>
      </div>

      {/* Session Details Card */}
      {session && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={session.status} />
              {session.sessionCode && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-0.5 font-mono text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <Tag className="h-3 w-3" />
                  {session.sessionCode}
                </span>
              )}
            </div>

            {sessionDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {new Date(sessionDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {session.endDate && (
                  <span>
                    {' '}
                    –{' '}
                    {new Date(session.endDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {sessionName}
          </h1>

          {session.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {session.description}
            </p>
          )}
        </div>
      )}

      {/* Video Player Section */}
      {activeVideo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Now Watching: {activeVideo.title}
              </h2>
            </div>
            {activeVideo.filename && activeVideo.filename !== activeVideo.title && (
              <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                {activeVideo.filename}
              </span>
            )}
          </div>

          <VideoPlayer
            video={activeVideo}
            src={playbackUrl}
            title={activeVideo.title}
            watermarkText={user ? `${user.name} • ${user.email}` : 'CodeClass LMS'}
          />
        </div>
      )}

      {/* Videos Section */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Session Videos ({videos.length})
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recorded lessons and class materials belonging to this session.
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <EmptyState
            title="No videos available for this session."
            description="When class recordings or video materials are uploaded, they will appear here."
            icon={<Film className="h-10 w-10 text-gray-400" />}
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {videos.map((v, index) => {
              const isActive = activeVideo?.videoRefId
                ? activeVideo.videoRefId === v.videoRefId
                : activeVideo?.id === v.id;

              return (
                <div
                  key={v.videoRefId || v.id || String(index)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 transition-colors ${
                    isActive
                      ? 'bg-brand-50/50 -mx-3 px-3 rounded-lg dark:bg-brand-950/20'
                      : 'hover:bg-gray-50/60 -mx-3 px-3 rounded-lg dark:hover:bg-gray-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 font-mono text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {v.title || `Video ${index + 1}`}
                      </p>
                      {v.filename && (
                        <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                          {v.filename}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Playing Now
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveVideo(v);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        <PlayCircle className="h-3.5 w-3.5" /> Watch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DRM / Watermark Protection Banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Protected content</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs leading-relaxed">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Class recordings are streamed securely with dynamic watermarking. Automatic downloading and screen capture shortcuts are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
