import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Loader as Loader2,
  CircleAlert as AlertCircle,
} from 'lucide-react';
import type { Video } from '@/types/api';
import { getYouTubeVideoId, getYouTubeEmbedUrl, getVideoProvider } from '@/utils/videoUtils';

export { getYouTubeVideoId, getYouTubeEmbedUrl, getVideoProvider };

export interface VideoPlayerProps {
  video?: Video | null;
  src?: string;
  watermarkText?: string;
  poster?: string;
  title?: string;
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ video, src, watermarkText = '', poster, title }: VideoPlayerProps) {
  // Resolve URL and display title
  const videoUrl = video?.url || video?.signedUrl || src || '';
  const displayTitle = title || video?.title || 'Video Player';

  // Provider detection: 'youtube' | 'html5'
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const provider = youtubeVideoId ? 'youtube' : 'html5';

  // State for YouTube embed
  const [youtubeError, setYoutubeError] = useState(false);

  // State for HTML5 player
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);

  // Reset errors and playback state when videoUrl changes
  useEffect(() => {
    setYoutubeError(false);
    setError(null);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [videoUrl]);

  // HTML5 controls
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setPlaying(true);
          setError(null);
        })
        .catch(() => setError('Unable to play video.'));
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = (Number(e.target.value) / 100) * duration;
    v.currentTime = t;
    setCurrent(t);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = Number(e.target.value) / 100;
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + sec, 0), duration);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Anti-recording shortcut protections (best-effort browser-level)
  useEffect(() => {
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
        k === 'f12' ||
        (e.ctrlKey && k === 's') ||
        (e.ctrlKey && k === 'p') ||
        (e.ctrlKey && k === 'u') ||
        (e.ctrlKey && e.shiftKey && k === 'k')
      ) {
        e.preventDefault();
      }
    };
    containerRef.current?.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKey);
    return () => {
      containerRef.current?.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const flashControls = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    flashControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  // Render YouTube Embed Iframe Player
  if (provider === 'youtube' && youtubeVideoId) {
    const embedUrl = getYouTubeEmbedUrl(youtubeVideoId);

    return (
      <div
        ref={containerRef}
        className="video-player-container group relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none shadow-md"
      >
        <iframe
          key={youtubeVideoId}
          src={embedUrl}
          title={displayTitle}
          className="h-full w-full border-0 block"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setYoutubeError(true)}
        />

        {/* Watermark overlay — semi-transparent, pointer-events-none so it doesn't interfere with YouTube player clicks */}
        {watermarkText && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
            <div
              className="absolute inset-0 flex flex-wrap items-center justify-around gap-x-16 gap-y-12 opacity-[0.10] text-white text-sm font-medium rotate-[-20deg]"
              style={{ fontSize: '0.875rem' }}
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="whitespace-nowrap drop-shadow">
                  {watermarkText}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error fallback if YouTube embed encounters an error */}
        {youtubeError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium">Unable to load this YouTube video.</p>
          </div>
        )}
      </div>
    );
  }

  // Render HTML5 Video Player
  return (
    <div
      ref={containerRef}
      className="video-player-container group relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none shadow-md"
      onMouseMove={flashControls}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setLoading(false);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setError('Unable to play video.');
          setLoading(false);
          setPlaying(false);
        }}
        className="h-full w-full object-contain"
      >
        {videoUrl && <source src={videoUrl} />}
        Your browser does not support video playback.
      </video>

      {/* Watermark overlay */}
      {watermarkText && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div
            className="absolute inset-0 flex flex-wrap items-center justify-around gap-x-16 gap-y-12 opacity-[0.12] text-white text-sm font-medium rotate-[-20deg]"
            style={{ fontSize: '0.875rem' }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap drop-shadow">
                {watermarkText}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {loading && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {/* Direct video playback error */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center text-white">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Center play button when paused */}
      {!playing && !loading && !error && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-transform hover:scale-110">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}

      {/* Custom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-2">
          <span className="w-12 text-right text-xs text-white/80 tabular-nums">
            {formatTime(current)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={onSeek}
            className="player-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/30"
            style={{
              background: `linear-gradient(to right, #3366ff ${progress}%, rgba(255,255,255,0.3) ${progress}%)`,
            }}
          />
          <span className="w-12 text-xs text-white/80 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-white">
          <button
            onClick={togglePlay}
            className="rounded p-1.5 hover:bg-white/20"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
          </button>
          <button onClick={() => skip(-10)} className="rounded p-1.5 hover:bg-white/20" aria-label="Back 10s">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={() => skip(10)} className="rounded p-1.5 hover:bg-white/20" aria-label="Forward 10s">
            <RotateCw className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="rounded p-1.5 hover:bg-white/20"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume * 100}
              onChange={changeVolume}
              className="player-range h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30"
              style={{
                background: `linear-gradient(to right, #fff ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          <div className="ml-auto flex items-center">
            <button
              onClick={toggleFullscreen}
              className="rounded p-1.5 hover:bg-white/20"
              aria-label="Fullscreen"
            >
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
