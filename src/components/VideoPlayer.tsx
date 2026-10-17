import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Cloud,
} from "lucide-react";
import type { Video, VideoProgress, VideoProgressCreateInput } from "@/types/api";
import { videoService } from "@/services";
import {
  detectVideoSource,
  getYouTubeEmbedUrl,
  sanitizeVideoUrlForLogging,
} from "@/utils/videoUtils";

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

interface VideoMetaRecord {
  videoRefId?: string;
  video_ref_id?: string;
  id?: string;
  videoId?: string | number;
  video_id?: string | number;
  refId?: string;
  uuid?: string;
  durationSec?: number;
  duration?: number;
  last_watched_duration?: number | string;
}

interface YouTubePlayerInstance {
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  destroy?: () => void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayerInstance;
  data?: number;
}

interface YouTubeWindow extends Window {
  YT?: {
    Player: new (
      element: HTMLElement | string,
      options: {
        events?: {
          onReady?: (event: YouTubePlayerEvent) => void;
          onStateChange?: (event: YouTubePlayerEvent) => void;
        };
      }
    ) => YouTubePlayerInstance;
  };
  onYouTubeIframeAPIReady?: () => void;
  Hls?: {
    isSupported: () => boolean;
    new (config?: { enableWorker?: boolean }): {
      loadSource: (src: string) => void;
      attachMedia: (video: HTMLVideoElement) => void;
      destroy: () => void;
    };
  };
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  video,
  src,
  watermarkText = "",
  poster,
  title,
}: VideoPlayerProps) {
  // 1. Resolve video URL, title, and reference ID
  const videoUrl = (video?.url || video?.signedUrl || src || "").trim();
  const displayTitle = title || video?.title || "Video Player";

  // Universal Source Detection
  const source = useMemo(() => detectVideoSource(videoUrl), [videoUrl]);

  // Google Drive direct stream fallback state
  const [driveDirectStreamFailed, setDriveDirectStreamFailed] = useState(false);

  useEffect(() => {
    setDriveDirectStreamFailed(false);
  }, [videoUrl]);

  // Is this playing as a native HTML5 video?
  // Native HTML5 is used for direct files, cloud storage (S3/GCS/Azure/CDN), HLS, DASH,
  // and Google Drive when direct streaming is available.
  const isDriveNative = source.type === "google-drive" && !driveDirectStreamFailed && !!source.streamUrl;
  const isNativeVideo =
    source.type === "direct" ||
    source.type === "hls" ||
    source.type === "dash" ||
    isDriveNative;

  const resolvedVideoSrc = useMemo(() => {
    if (source.type === "google-drive") {
      return source.streamUrl;
    }
    if (source.type === "hls") {
      return undefined;
    }
    return source.url || undefined;
  }, [source]);

  // Elements & container refs
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const videoRef = useRef<Video | null | undefined>(video);
  videoRef.current = video;

  // Playback UI states
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [resumeToast, setResumeToast] = useState<number | null>(null);

  // Authoritative videoRefId extraction
  const currentVideoRefId = useMemo(() => {
    const vMeta = video as unknown as VideoMetaRecord | undefined;
    const raw =
      video?.videoRefId ||
      vMeta?.video_ref_id ||
      video?.id ||
      (vMeta?.videoId ? String(vMeta.videoId) : null) ||
      (vMeta?.video_id ? String(vMeta.video_id) : null) ||
      vMeta?.refId ||
      vMeta?.uuid ||
      null;
    return raw ? String(raw).trim() : null;
  }, [video]);

  // Authoritative progress tracking & resume refs
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const latestCurrentTimeRef = useRef<number>(0);
  const latestDurationRef = useRef<number>(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRequestInFlightRef = useRef<boolean>(false);
  const pendingPausePositionRef = useRef<number | null>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const finalProgressSentRef = useRef<boolean>(false);
  const prevVideoKeyRef = useRef<string | null>(null);

  // Resume refs
  const resumePositionRef = useRef<number | null>(null);
  const resumeAppliedRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

  // YouTube IFrame API adapter refs
  const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const ytDurationRef = useRef<number>(0);

  // Synchronize playing ref
  useEffect(() => {
    isPlayingRef.current = playing;
  }, [playing]);

  // Active video reference ref to prevent cross-video progress saving
  const activeVideoIdRef = useRef<string | null>(currentVideoRefId);
  activeVideoIdRef.current = currentVideoRefId;

  // Resolve video reference ID
  const resolveVideoRefId = useCallback((): string | null => {
    return activeVideoIdRef.current || currentVideoRefId;
  }, [currentVideoRefId]);

  // Central progress saving API caller
  const sendVideoProgress = useCallback(
    async (position: number, isFinal = false) => {
      // Do not attempt to save progress if the provider is a third-party sandboxed iframe without playback API
      if (
        (source.type === "google-drive" && driveDirectStreamFailed) ||
        source.type === "vimeo" ||
        source.type === "unknown"
      ) {
        console.info("[LMS VIDEO: SAVE_SKIPPED] Sandboxed cross-origin provider does not expose playback events (Same-Origin Policy limitation).", {
          sourceType: source.type,
          videoRefId: activeVideoIdRef.current,
        });
        return;
      }

      const vRefId = activeVideoIdRef.current;
      if (!vRefId) {
        console.warn("[LMS VIDEO: SAVE_ABORTED] Missing or stale videoRefId", { vRefId });
        return;
      }

      // Guard: Do not overwrite a valid saved position with 0 during initial video loading
      if (
        !isFinal &&
        !resumeAppliedRef.current &&
        resumePositionRef.current !== null &&
        resumePositionRef.current > 0 &&
        position === 0
      ) {
        console.log("[LMS VIDEO: SAVE_SUPPRESSED] Suppressed zero overwrite while initial resume is pending");
        return;
      }

      // Guard: Avoid overlapping API requests
      if (progressRequestInFlightRef.current) {
        console.log("[LMS VIDEO: QUEUED] Request already in flight, queueing position:", position);
        pendingPausePositionRef.current = position;
        return;
      }

      // Determine accurate total duration
      let totalDur = 0;
      if (source.type === "youtube" && ytPlayerRef.current) {
        try {
          const d = ytPlayerRef.current.getDuration?.();
          if (typeof d === "number" && Number.isFinite(d) && d > 0) totalDur = d;
        } catch {
          // Ignore error reading duration from YouTube API
        }
      } else if (htmlVideoRef.current) {
        const d = htmlVideoRef.current.duration;
        if (typeof d === "number" && Number.isFinite(d) && d > 0) totalDur = d;
      }
      if (totalDur <= 0) {
        totalDur = latestDurationRef.current;
      }
      if (totalDur <= 0) {
        const vMeta = videoRef.current as unknown as VideoMetaRecord | undefined;
        totalDur = vMeta?.durationSec || vMeta?.duration || 0;
      }
      if (totalDur <= 0 && savedProgress?.videoDuration) {
        totalDur = savedProgress.videoDuration;
      }

      const safeDuration = Math.max(0, Math.floor(totalDur));

      // CRITICAL REQUIREMENT: Never send videoDuration: 0 when duration has not loaded yet
      if (!safeDuration || safeDuration <= 0) {
        console.warn("[LMS VIDEO: SAVE_ABORTED] Video duration metadata is not yet available. Suppressing save.");
        return;
      }

      const safePosition = Math.min(safeDuration, Math.max(0, Math.floor(position)));

      // Guard: Do not repeatedly send unchanged position if difference is less than 1s (unless marking completion)
      if (!isFinal && Math.abs(safePosition - lastSavedPositionRef.current) < 1 && lastSavedPositionRef.current > 0) {
        return;
      }

      // Exact 3-field payload required by LMS API specification:
      // Only videoRefId, lastWatchedDuration, and videoDuration are allowed.
      const payload: VideoProgressCreateInput = {
        videoRefId: String(vRefId),
        lastWatchedDuration: safePosition,
        videoDuration: safeDuration,
      };

      console.log("[LMS VIDEO: VALIDATION_PASSED]", {
        videoRefId: payload.videoRefId,
        lastWatchedDuration: payload.lastWatchedDuration,
        videoDuration: payload.videoDuration,
      });

      console.log("[LMS VIDEO: API_INVOKED] videoService.createVideoProgress called with payload:", payload);
      progressRequestInFlightRef.current = true;

      try {
        console.log("[LMS VIDEO: HTTP_REQUEST_STARTED] POST /api/video/createVideoProgress");
        await videoService.createVideoProgress(payload);
        if (activeVideoIdRef.current === vRefId) {
          lastSavedPositionRef.current = safePosition;
        }
        console.log("[LMS VIDEO: SAVE_SUCCESS] Progress saved to backend", {
          videoRefId: payload.videoRefId,
          savedPosition: safePosition,
          duration: safeDuration,
        });
      } catch (err) {
        console.error("[LMS VIDEO: SAVE_FAILED]", {
          videoRefId: payload.videoRefId,
          error: err instanceof Error ? err.message : err,
        });
      } finally {
        progressRequestInFlightRef.current = false;
        // Process queued pending pause position if one arrived while request was in-flight and video has not changed
        if (pendingPausePositionRef.current !== null && activeVideoIdRef.current === vRefId) {
          const nextPos = pendingPausePositionRef.current;
          pendingPausePositionRef.current = null;
          void sendVideoProgress(nextPos, isFinal);
        } else {
          pendingPausePositionRef.current = null;
        }
      }
    },
    [source.type, driveDirectStreamFailed, savedProgress?.videoDuration]
  );

  // Stop periodic progress tracking timer
  const stopProgressTracking = useCallback(() => {
    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      console.log("[LMS VIDEO: TIMER_STOPPED] Progress tracking timer cleared");
    }
  }, []);

  const sendVideoProgressRef = useRef(sendVideoProgress);
  sendVideoProgressRef.current = sendVideoProgress;

  // Start periodic 10-second progress tracking timer (only during active playback)
  const startProgressTracking = useCallback(() => {
    stopProgressTracking();

    // Sandboxed iframes without playback API do not expose real-time playback
    if (
      (source.type === "google-drive" && driveDirectStreamFailed) ||
      source.type === "vimeo" ||
      source.type === "unknown"
    ) {
      return;
    }

    console.log("[LMS VIDEO: TIMER_STARTED] 10-second progress interval started for video:", activeVideoIdRef.current);

    // Standard LMS interval: save progress every 10 seconds of active playback
    progressTimerRef.current = setInterval(() => {
      let isStillPlaying = isPlayingRef.current;
      if (htmlVideoRef.current) {
        if (htmlVideoRef.current.paused || htmlVideoRef.current.ended) {
          isStillPlaying = false;
        }
      }

      if (!isStillPlaying) {
        stopProgressTracking();
        return;
      }

      let currentPos = 0;
      if (source.type === "youtube" && ytPlayerRef.current) {
        try {
          const t = ytPlayerRef.current.getCurrentTime?.();
          if (typeof t === "number" && Number.isFinite(t)) currentPos = t;
        } catch {
          // Ignore error reading position from YouTube API
        }
      } else if (htmlVideoRef.current) {
        currentPos = htmlVideoRef.current.currentTime;
      }
      if ((!Number.isFinite(currentPos) || currentPos <= 0) && latestCurrentTimeRef.current > 0) {
        currentPos = latestCurrentTimeRef.current;
      }

      if (Number.isFinite(currentPos) && currentPos > 0) {
        console.log("[LMS VIDEO: 10S_TICK]", {
          videoRefId: activeVideoIdRef.current,
          currentPosition: Math.floor(currentPos),
        });
        void sendVideoProgressRef.current(currentPos, false);
      }
    }, 10000);
  }, [source.type, driveDirectStreamFailed, stopProgressTracking]);

  // Pause flush: stops timer and immediately saves current position
  const saveProgressOnPause = useCallback(
    async (explicitPosition?: number) => {
      if (finalProgressSentRef.current) return;

      let pos: number | undefined = explicitPosition;
      if (typeof pos !== "number") {
        if (source.type === "youtube" && ytPlayerRef.current) {
          try {
            const t = ytPlayerRef.current.getCurrentTime?.();
            if (typeof t === "number" && Number.isFinite(t)) pos = t;
          } catch {
            // Ignore error reading position from YouTube API
          }
        } else if (htmlVideoRef.current) {
          pos = htmlVideoRef.current.currentTime;
        }
        if ((typeof pos !== "number" || !Number.isFinite(pos) || pos <= 0) && latestCurrentTimeRef.current > 0) {
          pos = latestCurrentTimeRef.current;
        }
      }

      if (typeof pos === "number" && Number.isFinite(pos) && pos >= 0) {
        console.log("[LMS VIDEO: PAUSE_FLUSH]", {
          videoRefId: activeVideoIdRef.current,
          pausePosition: Math.floor(pos),
        });
        await sendVideoProgressRef.current(pos, false);
      }
    },
    [source.type]
  );

  const saveProgressOnPauseRef = useRef(saveProgressOnPause);
  saveProgressOnPauseRef.current = saveProgressOnPause;

  const stopProgressTrackingRef = useRef(stopProgressTracking);
  stopProgressTrackingRef.current = stopProgressTracking;

  // Play handler
  const handlePlay = useCallback(() => {
    console.log("[LMS VIDEO: EVENT_PLAY]", {
      videoRefId: activeVideoIdRef.current,
      sourceType: source.type,
    });
    setPlaying(true);
    isPlayingRef.current = true;
    startProgressTracking();
  }, [source.type, startProgressTracking]);

  // Pause handler
  const handlePause = useCallback(() => {
    console.log("[LMS VIDEO: EVENT_PAUSE]", {
      videoRefId: activeVideoIdRef.current,
      sourceType: source.type,
    });
    setPlaying(false);
    isPlayingRef.current = false;
    stopProgressTracking();
    void saveProgressOnPause();
  }, [source.type, stopProgressTracking, saveProgressOnPause]);

  // Ended handler
  const handleEnded = useCallback(() => {
    setPlaying(false);
    isPlayingRef.current = false;
    stopProgressTracking();

    if (finalProgressSentRef.current) return;
    finalProgressSentRef.current = true;

    let finalDur = 0;
    if (source.type === "youtube" && ytPlayerRef.current) {
      try {
        const d = ytPlayerRef.current.getDuration?.();
        if (typeof d === "number" && Number.isFinite(d)) finalDur = d;
      } catch {
        // Ignore error reading duration from YouTube API
      }
    } else if (htmlVideoRef.current) {
      finalDur = htmlVideoRef.current.duration || 0;
    }
    if (finalDur <= 0) {
      finalDur = duration || lastSavedPositionRef.current || 0;
    }

    console.log("[LMS VIDEO: EVENT_ENDED]", {
      videoRefId: activeVideoIdRef.current,
      finalDuration: finalDur,
      isCompleted: true,
    });

    void sendVideoProgress(finalDur, true);
  }, [source.type, stopProgressTracking, duration, sendVideoProgress]);

  // Seeking handler
  const handleSeek = useCallback((newTime: number) => {
    const clamped = Math.max(0, Math.floor(newTime));
    latestCurrentTimeRef.current = clamped;
  }, []);

  // Authoritative Resume Restorer
  const applyResumePosition = useCallback(() => {
    if (resumeAppliedRef.current) {
      return;
    }

    if (resumePositionRef.current === null) {
      return;
    }

    const savedPos = Number(resumePositionRef.current);
    if (!Number.isFinite(savedPos) || savedPos <= 0) {
      resumeAppliedRef.current = true;
      return;
    }

    // 1. YouTube Provider
    if (source.type === "youtube") {
      if (isCompletedRef.current) {
        resumeAppliedRef.current = true;
        return;
      }

      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        let ytDuration = 0;
        try {
          const d = ytPlayerRef.current.getDuration?.();
          if (typeof d === "number" && Number.isFinite(d) && d > 0) ytDuration = d;
        } catch {
          // Ignore error reading duration from YouTube API
        }

        const safePos =
          ytDuration > 0
            ? Math.min(savedPos, Math.max(0, ytDuration - 1))
            : savedPos;

        try {
          ytPlayerRef.current.seekTo(safePos, true);
          latestCurrentTimeRef.current = safePos;
          lastSavedPositionRef.current = Math.floor(safePos);
          resumeAppliedRef.current = true;
          setResumeToast(safePos);
          setTimeout(() => setResumeToast(null), 3500);
        } catch (err) {
          console.warn("[VIDEO RESUME] Unable to apply YouTube saved position", err);
        }
      }
      return;
    }

    // 2. HTML5 Video Element (Direct / AWS S3 / CloudFront / GCS / Azure / HLS / DASH)
    const videoEl = htmlVideoRef.current;
    if (videoEl) {
      // Must wait until metadata and duration are ready
      if (
        videoEl.readyState < 1 ||
        !Number.isFinite(videoEl.duration) ||
        videoEl.duration <= 0
      ) {
        return;
      }

      const totalDur = videoEl.duration;

      // If video was already completed or saved near the very end, start from 0
      if (isCompletedRef.current || (totalDur > 0 && savedPos >= totalDur - 2)) {
        console.log("[LMS VIDEO: RESUME_START_ZERO]", {
          videoRefId: activeVideoIdRef.current,
          savedPosition: savedPos,
          totalDuration: totalDur,
          reason: isCompletedRef.current ? "already_completed" : "near_end_boundary",
        });
        videoEl.currentTime = 0;
        setCurrent(0);
        resumeAppliedRef.current = true;
        return;
      }

      const safePos = Math.min(savedPos, Math.max(0, totalDur - 1));
      console.log("[LMS VIDEO: RESUME_SEEK_SUCCESS]", {
        videoRefId: activeVideoIdRef.current,
        resumedTo: safePos,
        totalDuration: totalDur,
      });
      videoEl.currentTime = safePos;
      setCurrent(safePos);
      latestCurrentTimeRef.current = safePos;
      lastSavedPositionRef.current = Math.floor(safePos);
      resumeAppliedRef.current = true;
      setResumeToast(safePos);
      setTimeout(() => setResumeToast(null), 3500);
      return;
    }

    // 3. Google Drive / Other Embeds:
    // Google Drive's sandboxed preview iframe does not expose an external JavaScript seek API.
    // Instead, start-time resume is passed directly in the iframe src URL query parameter '?t=...s'.
    if (source.type === "google-drive") {
      console.log("[LMS VIDEO: GOOGLE_DRIVE_NOTICE]", {
        videoRefId: activeVideoIdRef.current,
        note: "Google Drive sandboxed preview iframe does not expose an external JavaScript seek API. Start position is applied via iframe URL parameter '?t=...s'.",
        startPosition: savedPos,
      });
      resumeAppliedRef.current = true;
      if (savedPos > 0) {
        setResumeToast(savedPos);
        setTimeout(() => setResumeToast(null), 3500);
      }
    }
  }, [source.type]);

  // Video Changed: Reset all tracking states & fetch saved progress
  useEffect(() => {
    const vRefId = resolveVideoRefId();
    const videoKey = `${vRefId || ""}-${videoUrl || ""}`;
    if (videoKey === prevVideoKeyRef.current) {
      return;
    }
    prevVideoKeyRef.current = videoKey;

    stopProgressTracking();
    progressRequestInFlightRef.current = false;
    pendingPausePositionRef.current = null;
    resumeAppliedRef.current = false;
    resumePositionRef.current = null;
    isCompletedRef.current = false;
    lastSavedPositionRef.current = 0;
    latestCurrentTimeRef.current = 0;
    latestDurationRef.current = 0;
    finalProgressSentRef.current = false;
    setResumeToast(null);

    setIframeError(false);
    setError(null);
    setPlaying(false);
    isPlayingRef.current = false;
    setCurrent(0);
    setDuration(0);
    setSavedProgress(null);

    if (!vRefId) {
      return;
    }

    let active = true;
    void videoService
      .getVideoProgress(vRefId)
      .then((progress) => {
        if (!active || activeVideoIdRef.current !== vRefId) return;
        setSavedProgress(progress);
        if (progress) {
          const progMeta = progress as unknown as VideoMetaRecord;
          const rawDuration =
            progress.lastWatchedDuration ??
            progMeta?.last_watched_duration;
          const parsed = Number(rawDuration);
          const durationVal = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
          resumePositionRef.current = durationVal;
          isCompletedRef.current = Boolean(progress.isCompleted);
          if (durationVal > 0) {
            lastSavedPositionRef.current = Math.floor(durationVal);
          }
          console.log("[LMS VIDEO: GET_PROGRESS_SUCCESS]", {
            videoRefId: vRefId,
            lastWatchedDuration: durationVal,
            isCompleted: Boolean(progress.isCompleted),
          });
        } else {
          resumePositionRef.current = 0;
          isCompletedRef.current = false;
        }
        applyResumePosition();
      })
      .catch((err) => {
        console.warn("[LMS VIDEO: GET_PROGRESS_FAILED]", { videoRefId: vRefId, error: err });
        if (active && activeVideoIdRef.current === vRefId) {
          resumePositionRef.current = 0;
          isCompletedRef.current = false;
          applyResumePosition();
        }
      });

    return () => {
      active = false;
    };
  }, [currentVideoRefId, videoUrl, resolveVideoRefId, stopProgressTracking, applyResumePosition]);

  // Lifecycle flush on tab hide / page leave / unmount
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isPlayingRef.current) {
        void saveProgressOnPauseRef.current?.();
      }
    };

    const handleBeforeUnload = () => {
      if (isPlayingRef.current) {
        void saveProgressOnPauseRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopProgressTrackingRef.current?.();
      if (isPlayingRef.current) {
        void saveProgressOnPauseRef.current?.();
      }
      progressRequestInFlightRef.current = false;
      isPlayingRef.current = false;
    };
  }, []);

  // Log unsupported sources without exposing sensitive tokens
  useEffect(() => {
    if (source.type === "unknown" && videoUrl) {
      console.error("[VIDEO PLAYER] Unsupported video source:", {
        url: sanitizeVideoUrlForLogging(videoUrl),
        sourceType: source.type,
      });
    }
  }, [source.type, videoUrl]);

  // YouTube postMessage and IFrame API adapter
  useEffect(() => {
    if (source.type !== "youtube" || !source.videoId) return;

    let active = true;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (data && data.event === "onStateChange") {
          if (data.info === 1) {
            handlePlay();
          } else if (data.info === 2) {
            handlePause();
          } else if (data.info === 0) {
            handleEnded();
          }
        } else if (data && data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") {
            latestCurrentTimeRef.current = data.info.currentTime;
          }
          if (typeof data.info.duration === "number") {
            ytDurationRef.current = data.info.duration;
            setDuration(data.info.duration);
          }
        }
      } catch {
        // Ignore malformed postMessage data
      }
    };

    window.addEventListener("message", handleMessage);

    const initYt = () => {
      if (!iframeRef.current || !active) return;
      try {
        const win = window as unknown as YouTubeWindow;
        const YT = win.YT;
        if (YT && YT.Player) {
          ytPlayerRef.current = new YT.Player(iframeRef.current, {
            events: {
              onReady: (event: YouTubePlayerEvent) => {
                ytPlayerRef.current = event.target;
                applyResumePosition();
              },
              onStateChange: (event: YouTubePlayerEvent) => {
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
      } catch {
        // Ignore YouTube player initialization error
      }
    };

    if (typeof window !== "undefined") {
      const win = window as unknown as YouTubeWindow;
      if (win.YT && win.YT.Player) {
        initYt();
      } else {
        const existingCallback = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          if (typeof existingCallback === "function") existingCallback();
          initYt();
        };
        if (!document.getElementById("yt-iframe-api-script")) {
          const tag = document.createElement("script");
          tag.id = "yt-iframe-api-script";
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        }
      }
    }

    return () => {
      active = false;
      window.removeEventListener("message", handleMessage);
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        // Ignore YouTube player destroy error
      }
      ytPlayerRef.current = null;
    };
  }, [source.type, source.videoId, handlePlay, handlePause, handleEnded, applyResumePosition]);

  // Synchronize resume position for YouTube when savedProgress loads after player initialization
  useEffect(() => {
    if (source.type === "youtube" && !resumeAppliedRef.current && savedProgress) {
      applyResumePosition();
    }
  }, [savedProgress, source.type, applyResumePosition]);

  // HLS stream attachment when source is .m3u8
  useEffect(() => {
    if (source.type !== "hls" || !htmlVideoRef.current) return;
    const v = htmlVideoRef.current;

    const win = typeof window !== "undefined" ? (window as unknown as YouTubeWindow) : null;
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = source.url;
    } else if (win?.Hls && win.Hls.isSupported()) {
      const Hls = win.Hls;
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(source.url);
      hls.attachMedia(v);
      return () => {
        hls.destroy();
      };
    } else {
      v.src = source.url;
    }
  }, [source.type, source.url]);

  // HTML5 loaded metadata callback
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget;
    const totalDuration = videoEl.duration;
    setDuration(totalDuration);
    latestDurationRef.current = totalDuration;
    setLoading(false);
    console.log("[LMS VIDEO: PLAYER_READY]", {
      videoRefId: activeVideoIdRef.current,
      duration: totalDuration,
      sourceType: source.type,
    });
    applyResumePosition();
  };

  // Synchronize resume position for HTML5 when savedProgress arrives after metadata loaded
  useEffect(() => {
    if (!resumeAppliedRef.current && savedProgress) {
      applyResumePosition();
    }
  }, [savedProgress, applyResumePosition]);

  // HTML5 custom controls handlers
  const togglePlay = useCallback(() => {
    const v = htmlVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setPlaying(true);
          isPlayingRef.current = true;
          setError(null);
        })
        .catch((playbackErr) => {
          console.error("[VIDEO PLAYER] Playback error:", {
            sourceType: source.type,
            url: sanitizeVideoUrlForLogging(videoUrl),
            error: playbackErr,
          });
          setError("Unable to play this video.");
        });
    } else {
      v.pause();
    }
  }, [source.type, videoUrl]);

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = (Number(e.target.value) / 100) * duration;
    setCurrent(t);
    latestCurrentTimeRef.current = t;
    const v = htmlVideoRef.current;
    if (v) {
      v.currentTime = t;
    }
    handleSeek(t);
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
    const nextTime = Math.min(Math.max(current + sec, 0), duration);
    setCurrent(nextTime);
    latestCurrentTimeRef.current = nextTime;
    const v = htmlVideoRef.current;
    if (v) {
      v.currentTime = nextTime;
    }
    handleSeek(nextTime);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
        .then(() => setFullscreen(true))
        .catch(() => {
          // Ignore fullscreen error
        });
    } else {
      document
        .exitFullscreen?.()
        .then(() => setFullscreen(false))
        .catch(() => {
          // Ignore exit fullscreen error
        });
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Anti-recording and security shortcut protections
  useEffect(() => {
    const el = containerRef.current;
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        k === "f12" ||
        (e.ctrlKey && k === "s") ||
        (e.ctrlKey && k === "p") ||
        (e.ctrlKey && k === "u") ||
        (e.ctrlKey && e.shiftKey && k === "k")
      ) {
        e.preventDefault();
      }
    };
    el?.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey);
    return () => {
      el?.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKey);
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
      {/* Resume Toast Notification */}
      {resumeToast !== null && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 rounded-lg bg-black/85 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm border border-emerald-500/30 animate-fade-in">
          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
          <span>Resumed playback from {formatTime(resumeToast)}</span>
        </div>
      )}

      {/* 1. YouTube Player */}
      {source.type === "youtube" && source.videoId ? (
        <>
          <iframe
            ref={iframeRef}
            key={`${source.videoId}-${savedProgress?.lastWatchedDuration || 0}`}
            id="youtube-player-frame"
            src={getYouTubeEmbedUrl(
              source.videoId,
              savedProgress && !savedProgress.isCompleted
                ? savedProgress.lastWatchedDuration
                : 0
            )}
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={(e) => {
              console.error("[VIDEO PLAYER] YouTube embed error:", {
                sourceType: "youtube",
                url: sanitizeVideoUrlForLogging(videoUrl),
                error: e,
              });
              setIframeError(true);
            }}
          />
          {iframeError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">Unable to play this YouTube video.</p>
            </div>
          )}
        </>
      ) : null}

      {/* 2. Vimeo Player */}
      {source.type === "vimeo" && source.videoId ? (
        <>
          <iframe
            src={`https://player.vimeo.com/video/${source.videoId}?autoplay=0&title=0&byline=0&portrait=0`}
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onError={(e) => {
              console.error("[VIDEO PLAYER] Vimeo embed error:", {
                sourceType: "vimeo",
                url: sanitizeVideoUrlForLogging(videoUrl),
                error: e,
              });
              setIframeError(true);
            }}
          />
          {iframeError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">Unable to play this Vimeo video.</p>
            </div>
          )}
        </>
      ) : null}

      {/* 3. Google Drive Fallback Player (Plays via official Google Drive preview embed when direct stream is unavailable) */}
      {source.type === "google-drive" && (driveDirectStreamFailed || !source.streamUrl) && source.videoId ? (
        <div className="relative h-full w-full bg-black">
          {/* Informational provider badge */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm pointer-events-none border border-white/10">
            <Cloud className="h-3.5 w-3.5 text-blue-400" />
            <span>Google Drive Preview</span>
          </div>

          {/* Informational notice when saved progress exists from previous session */}
          {savedProgress && !savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0 && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-md bg-black/75 px-3 py-1.5 text-xs text-amber-200 backdrop-blur-sm border border-amber-500/30">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Resumed from: <strong>{formatTime(savedProgress.lastWatchedDuration)}</strong>
              </span>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={`${source.videoId}-${savedProgress?.lastWatchedDuration || 0}`}
            src={`https://drive.google.com/file/d/${source.videoId}/preview${
              savedProgress && !savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0
                ? `?t=${Math.floor(savedProgress.lastWatchedDuration)}s`
                : ""
            }`}
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onError={(e) => {
              console.error("[VIDEO PLAYER] Google Drive embed error:", {
                sourceType: "google-drive",
                url: sanitizeVideoUrlForLogging(videoUrl),
                error: e,
              });
              setIframeError(true);
            }}
          />

          {iframeError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/85 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">Unable to play this Google Drive video.</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Please verify that the file sharing permissions on Google Drive are set to &quot;Anyone with the link can view&quot;.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* 4. Native Video Player (Direct, S3, CloudFront, GCS, Azure, CDN, HLS, DASH, and Google Drive Direct Stream) */}
      {isNativeVideo ? (
        <>
          {/* Informational provider badge for Google Drive stream */}
          {source.type === "google-drive" && !driveDirectStreamFailed && (
            <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm pointer-events-none border border-white/10">
              <Cloud className="h-3.5 w-3.5 text-blue-400" />
              <span>Google Drive Stream</span>
            </div>
          )}

          <video
            ref={htmlVideoRef}
            src={source.type === "hls" ? undefined : resolvedVideoSrc}
            poster={poster}
            playsInline
            controls={false}
            preload="metadata"
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              setCurrent(t);
              latestCurrentTimeRef.current = t;
            }}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={(e) => {
              handleSeek(e.currentTarget.currentTime);
            }}
            onWaiting={() => setLoading(true)}
            onPlaying={() => setLoading(false)}
            onCanPlay={() => {
              setLoading(false);
              applyResumePosition();
            }}
            onEnded={handleEnded}
            onError={(e) => {
              console.error("[VIDEO PLAYER] Native playback error:", {
                sourceType: source.type,
                url: sanitizeVideoUrlForLogging(resolvedVideoSrc || videoUrl),
                error: e,
              });
              if (source.type === "google-drive" && !driveDirectStreamFailed) {
                console.warn("[VIDEO PLAYER] Google Drive direct stream failed. Falling back to official Drive preview embed.");
                setDriveDirectStreamFailed(true);
                return;
              }
              setError("Unable to play this video.");
              setLoading(false);
              setPlaying(false);
              isPlayingRef.current = false;
            }}
            className="h-full w-full object-contain"
          >
            Your browser does not support video playback.
          </video>

          {/* Loading spinner */}
          {loading && !error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <Loader2 className="h-10 w-10 animate-spin text-white/80" />
            </div>
          )}

          {/* Playback error banner */}
          {error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/75 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Big center play button when paused */}
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

          {/* Custom controls bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity duration-200 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Progress bar slider */}
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
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </button>
              <button
                onClick={() => skip(-10)}
                className="rounded p-1.5 hover:bg-white/20"
                aria-label="Back 10s"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => skip(10)}
                className="rounded p-1.5 hover:bg-white/20"
                aria-label="Forward 10s"
              >
                <RotateCw className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="rounded p-1.5 hover:bg-white/20"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
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
                  {fullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* 5. Unknown / Unsupported video source */}
      {source.type === "unknown" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-white">
          <AlertCircle className="h-12 w-12 text-amber-400" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Unsupported video source
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Unable to play this video. The URL format is not supported.
            </p>
          </div>
        </div>
      ) : null}

      {/* Watermark overlay */}
      {watermarkText && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
          <div
            className="absolute inset-0 flex flex-wrap items-center justify-around gap-x-16 gap-y-12 opacity-[0.10] text-white text-sm font-medium rotate-[-20deg]"
            style={{ fontSize: "0.875rem" }}
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
