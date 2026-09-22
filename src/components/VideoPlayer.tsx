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
import type { Video, VideoProgress } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import { videoService } from '@/services';
import { getYouTubeVideoId, getYouTubeEmbedUrl, getVideoProvider } from '@/utils/videoUtils';

export { getYouTubeVideoId, getYouTubeEmbedUrl, getVideoProvider };

export interface VideoPlayerProps {
  video?: Video | null;
  src?: string;
  watermarkText?: string;
  poster?: string;
  title?: string;
}

export interface PlayableVideo {
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ video, src, watermarkText = '', poster, title }: VideoPlayerProps) {
  // Resolve URL and display title
  const videoUrl = (video?.url || video?.signedUrl || src || '').trim();
  const displayTitle = title || video?.title || 'Video Player';

  // Provider detection: 'youtube' | 'html5'
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const detectedVideoType: 'youtube' | 'html5' = youtubeVideoId ? 'youtube' : 'html5';

  // State for YouTube embed
  const [youtubeError, setYoutubeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytTimeRef = useRef<number>(0);
  const ytDurationRef = useRef<number>(0);
  const isYtPlayingRef = useRef<boolean>(false);

  // Unified media ref and HTML5 video element ref
  const videoRef = useRef<PlayableVideo | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
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

  // Authentication and role checking (progress tracking is ONLY for role === "user")
  const { user } = useAuth();
  const currentVideoRefId = video?.videoRefId || video?.id || null;

  // Video progress state and refs
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasResumedRef = useRef<boolean>(false);

  // Clear progress interval
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Save progress in background (non-blocking, fire-and-forget)
  const saveVideoProgress = useCallback(async (isFinal = false) => {
    if (user?.role !== 'user') return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!isFinal && (videoEl.paused || videoEl.ended)) {
      return;
    }

    const vRefId = currentVideoRefId;
    if (!vRefId) return;

    console.log("CALLING createVideoProgress");

    try {
      await videoService.createVideoProgress({
        videoRefId: String(vRefId),
        lastWatchedDuration: videoEl.currentTime,
        videoDuration: videoEl.duration,
      });
      console.log("createVideoProgress SUCCESS");
    } catch (apiError) {
      console.error("createVideoProgress FAILED", apiError);
    }
  }, [user?.role, currentVideoRefId]);

  // Start 10-second progress interval while actively playing
  const startProgressTracking = useCallback(() => {
    stopProgressTracking();

    if (user?.role !== 'user') return;

    console.log("VIDEO PROGRESS TIMER STARTED");

    progressIntervalRef.current = setInterval(() => {
      const videoEl = videoRef.current;

      if (!videoEl) {
        return;
      }

      if (videoEl.paused || videoEl.ended) {
        return;
      }

      console.log("VIDEO PROGRESS TIMER FIRED", {
        currentTime: videoEl.currentTime,
        duration: videoEl.duration,
      });

      void saveVideoProgress();
    }, 10000);
  }, [user?.role, stopProgressTracking, saveVideoProgress]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    isYtPlayingRef.current = true;
    console.log("VIDEO PLAYING");

    if (user?.role === 'user') {
      console.log("VIDEO PLAY - starting progress timer");
      startProgressTracking();
    }
  }, [user?.role, startProgressTracking]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    isYtPlayingRef.current = false;
    if (user?.role === 'user') {
      console.log("VIDEO PAUSED - stopping progress timer");
    }
    stopProgressTracking();
  }, [user?.role, stopProgressTracking]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    isYtPlayingRef.current = false;
    if (user?.role === 'user') {
      console.log("VIDEO ENDED - stopping progress timer");
    }
    stopProgressTracking();
    if (user?.role === 'user') {
      void saveVideoProgress(true);
    }
  }, [user?.role, stopProgressTracking, saveVideoProgress]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  // Fetch saved video progress on mount or video change
  useEffect(() => {
    stopProgressTracking();
    hasResumedRef.current = false;
    setSavedProgress(null);

    console.log("VIDEO URL:", videoUrl);
    console.log("VIDEO TYPE:", detectedVideoType);

    if (user?.role !== 'user' || !currentVideoRefId) {
      console.log("VIDEO PROGRESS:", null);
      return () => {
        stopProgressTracking();
      };
    }

    let active = true;
    void videoService
      .getVideoProgress(currentVideoRefId)
      .then((progress) => {
        if (!active) return;
        console.log("VIDEO PROGRESS:", progress);
        setSavedProgress(progress);
      })
      .catch((err) => {
        console.warn('Failed to load video progress:', err);
      });

    return () => {
      active = false;
      stopProgressTracking();
    };
  }, [currentVideoRefId, user?.role, videoUrl, detectedVideoType, stopProgressTracking]);

  // Provide YouTube adapter to videoRef
  useEffect(() => {
    if (detectedVideoType === 'youtube') {
      videoRef.current = {
        get currentTime() {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            try {
              const t = ytPlayerRef.current.getCurrentTime();
              if (typeof t === 'number' && !isNaN(t)) return t;
            } catch {}
          }
          return ytTimeRef.current;
        },
        get duration() {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === 'function') {
            try {
              const d = ytPlayerRef.current.getDuration();
              if (typeof d === 'number' && !isNaN(d)) return d;
            } catch {}
          }
          return ytDurationRef.current;
        },
        get paused() {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
            try {
              const state = ytPlayerRef.current.getPlayerState();
              return state !== 1;
            } catch {}
          }
          return !isYtPlayingRef.current;
        },
        get ended() {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
            try {
              return ytPlayerRef.current.getPlayerState() === 0;
            } catch {}
          }
          return false;
        },
      };
    }
  }, [detectedVideoType]);

  // YouTube postMessage and IFrame API listeners
  useEffect(() => {
    if (detectedVideoType !== 'youtube' || !youtubeVideoId) return;

    let active = true;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && data.event === 'onStateChange') {
          if (data.info === 1) {
            handlePlay();
          } else if (data.info === 2) {
            handlePause();
          } else if (data.info === 0) {
            handleEnded();
          }
        } else if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            ytTimeRef.current = data.info.currentTime;
          }
          if (typeof data.info.duration === 'number') {
            ytDurationRef.current = data.info.duration;
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);

    const applyResumeToYouTube = (player: any) => {
      if (!hasResumedRef.current && user?.role === 'user' && savedProgress) {
        if (!savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0) {
          const resumeTime = savedProgress.lastWatchedDuration;
          console.log("RESUMING VIDEO FROM:", resumeTime);
          try {
            player.seekTo(resumeTime, false);
            ytTimeRef.current = resumeTime;
            hasResumedRef.current = true;
          } catch {}
        } else if (savedProgress.isCompleted) {
          try {
            player.seekTo(0, false);
            ytTimeRef.current = 0;
            hasResumedRef.current = true;
          } catch {}
        }
      }
    };

    const initYt = () => {
      if (!iframeRef.current || !active) return;
      try {
        const YT = (window as any).YT;
        if (YT && YT.Player) {
          ytPlayerRef.current = new YT.Player(iframeRef.current, {
            events: {
              onReady: (event: any) => {
                console.log("YOUTUBE PLAYER READY");
                applyResumeToYouTube(event.target);
              },
              onStateChange: (event: any) => {
                if (event.data === 1) {
                  handlePlay();
                } else if (event.data === 2) {
                  handlePause();
                } else if (event.data === 0) {
                  handleEnded();
                }
              },
            },
          });
        }
      } catch {}
    };

    if (typeof window !== 'undefined') {
      if ((window as any).YT && (window as any).YT.Player) {
        initYt();
      } else {
        const existingCallback = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (typeof existingCallback === 'function') existingCallback();
          initYt();
        };
        if (!document.getElementById('yt-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'yt-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }
      }
    }

    return () => {
      active = false;
      window.removeEventListener('message', handleMessage);
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {}
      ytPlayerRef.current = null;
    };
  }, [detectedVideoType, youtubeVideoId, handlePlay, handlePause, handleEnded, user?.role, savedProgress]);

  // Synchronize resume position for YouTube when savedProgress loads after player initialization
  useEffect(() => {
    if (detectedVideoType !== 'youtube' || hasResumedRef.current || !savedProgress || user?.role !== 'user') return;

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      if (!savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0) {
        const resumeTime = savedProgress.lastWatchedDuration;
        console.log("RESUMING VIDEO FROM:", resumeTime);
        try {
          ytPlayerRef.current.seekTo(resumeTime, false);
          ytTimeRef.current = resumeTime;
          hasResumedRef.current = true;
        } catch {}
      } else if (savedProgress.isCompleted) {
        try {
          ytPlayerRef.current.seekTo(0, false);
          ytTimeRef.current = 0;
          hasResumedRef.current = true;
        } catch {}
      }
    }
  }, [savedProgress, detectedVideoType, user?.role]);

  // Synchronize resume position for HTML5 when savedProgress loads after metadata already loaded
  useEffect(() => {
    if (detectedVideoType !== 'html5' || hasResumedRef.current || !savedProgress || user?.role !== 'user') return;

    const v = htmlVideoRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      if (!savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0) {
        const resumeTime = savedProgress.lastWatchedDuration;
        if (resumeTime >= 0 && resumeTime < v.duration) {
          console.log("RESUMING VIDEO FROM:", resumeTime);
          v.currentTime = resumeTime;
          setCurrent(resumeTime);
          hasResumedRef.current = true;
        }
      } else if (savedProgress.isCompleted) {
        v.currentTime = 0;
        setCurrent(0);
        hasResumedRef.current = true;
      }
    }
  }, [savedProgress, detectedVideoType, user?.role]);

  // Reset errors and playback state when videoUrl changes
  useEffect(() => {
    setYoutubeError(false);
    setError(null);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [videoUrl]);

  // HTML5 loaded metadata callback
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget;
    setDuration(videoEl.duration);
    setLoading(false);

    console.log("VIDEO METADATA LOADED", {
      duration: videoEl.duration,
    });

    if (!hasResumedRef.current && user?.role === 'user' && savedProgress) {
      if (!savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0) {
        const resumeTime = savedProgress.lastWatchedDuration;
        if (
          Number.isFinite(videoEl.duration) &&
          videoEl.duration > 0 &&
          resumeTime >= 0 &&
          resumeTime < videoEl.duration
        ) {
          console.log("RESUMING VIDEO FROM:", resumeTime);
          videoEl.currentTime = resumeTime;
          setCurrent(resumeTime);
          hasResumedRef.current = true;
        }
      } else if (savedProgress.isCompleted) {
        videoEl.currentTime = 0;
        setCurrent(0);
        hasResumedRef.current = true;
      }
    }
  };

  // HTML5 controls
  const togglePlay = useCallback(() => {
    const v = htmlVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setPlaying(true);
          setError(null);
        })
        .catch((playbackErr) => {
          console.error("VIDEO PLAYBACK ERROR", playbackErr);
          setError('Unable to play video.');
        });
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = htmlVideoRef.current;
    if (!v) return;
    const t = (Number(e.target.value) / 100) * duration;
    v.currentTime = t;
    setCurrent(t);
  };

  const toggleMute = () => {
    const v = htmlVideoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = htmlVideoRef.current;
    if (!v) return;
    const vol = Number(e.target.value) / 100;
    v.volume = vol;
    v.muted = vol === 0;
    setVolume(vol);
    setMuted(vol === 0);
  };

  const skip = (sec: number) => {
    const v = htmlVideoRef.current;
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

  return (
    <div
      ref={containerRef}
      className="video-player-container group relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none shadow-md"
      onMouseMove={flashControls}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {detectedVideoType === 'youtube' && youtubeVideoId ? (
        <>
          <iframe
            ref={iframeRef}
            key={`${youtubeVideoId}-${savedProgress?.lastWatchedDuration || 0}`}
            id="youtube-player-frame"
            src={getYouTubeEmbedUrl(
              youtubeVideoId,
              savedProgress && !savedProgress.isCompleted ? savedProgress.lastWatchedDuration : 0
            )}
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={(e) => {
              console.error("VIDEO PLAYBACK ERROR", e);
              setYoutubeError(true);
            }}
          />
          {youtubeError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">Unable to load this YouTube video.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <video
            ref={(el) => {
              htmlVideoRef.current = el;
              videoRef.current = el;
            }}
            src={videoUrl}
            poster={poster}
            playsInline
            controls={false}
            preload="metadata"
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onPlay={handlePlay}
            onPause={handlePause}
            onWaiting={() => setLoading(true)}
            onPlaying={() => setLoading(false)}
            onCanPlay={() => setLoading(false)}
            onEnded={handleEnded}
            onError={(e) => {
              console.error("VIDEO PLAYBACK ERROR", e);
              setError('Unable to play video.');
              setLoading(false);
              setPlaying(false);
              stopProgressTracking();
            }}
            className="h-full w-full object-contain"
          >
            Your browser does not support video playback.
          </video>

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
        </>
      )}

      {/* Watermark overlay */}
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
    </div>
  );
}
