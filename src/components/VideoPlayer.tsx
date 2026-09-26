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
} from "lucide-react";
import type { Video, VideoProgress } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { videoService } from "@/services";
import {
  detectVideoSource,
  getYouTubeVideoId,
  getYouTubeEmbedUrl,
  getVideoProvider,
  getGoogleDriveFileId,
  getVimeoVideoId,
  sanitizeVideoUrlForLogging,
  type DetectedVideoSource,
  type VideoSourceType,
} from "@/utils/videoUtils";

export {
  detectVideoSource,
  getYouTubeVideoId,
  getYouTubeEmbedUrl,
  getVideoProvider,
  getGoogleDriveFileId,
  getVimeoVideoId,
  sanitizeVideoUrlForLogging,
  type DetectedVideoSource,
  type VideoSourceType,
};

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
  // Resolve video URL and title
  const videoUrl = (video?.url || video?.signedUrl || src || "").trim();
  const displayTitle = title || video?.title || "Video Player";

  // 1. Universal Source Detection
  const source = useMemo(() => detectVideoSource(videoUrl), [videoUrl]);
  console.log("[VIDEO PLAYER] videoUrl:", JSON.stringify(videoUrl), "source:", source);

  // Native HTML5 video is for direct, HLS, and DASH streams
  const isNativeVideo =
    source.type === "direct" || source.type === "hls" || source.type === "dash";

  // State for Iframe / embed errors
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // YouTube IFrame API adapter refs (PRESERVED UNCHANGED)
  const ytPlayerRef = useRef<any>(null);
  const ytTimeRef = useRef<number>(0);
  const ytDurationRef = useRef<number>(0);
  const isYtPlayingRef = useRef<boolean>(false);

  // Google Drive player adapter refs
  const driveTimeRef = useRef<number>(0);
  const isDrivePlayingRef = useRef<boolean>(false);
  const isDriveEndedRef = useRef<boolean>(false);

  // Single Progress Controller with Refs
  const videoRef = useRef<PlayableVideo | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback UI states
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

  // User auth context
  const { user } = useAuth();
  const currentVideoRefId = useMemo(() => {
    const raw =
      video?.videoRefId ||
      (video as any)?.video_ref_id ||
      video?.id ||
      ((video as any)?.videoId ? String((video as any).videoId) : null) ||
      ((video as any)?.video_id ? String((video as any).video_id) : null) ||
      (video as any)?.refId ||
      (video as any)?.uuid ||
      null;
    return raw ? String(raw).trim() : null;
  }, [video]);

  // Video progress state and tracking refs
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const latestCurrentTimeRef = useRef<number>(0);
  const latestDurationRef = useRef<number>(0);

  // Single authoritative progress controller refs
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRequestInFlightRef = useRef<boolean>(false);
  const pendingPausePositionRef = useRef<number | null>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const lastCheckedPositionRef = useRef<number>(0);
  const prevTickPositionRef = useRef<number>(0);
  const finalProgressSentRef = useRef<boolean>(false);
  const currentVideoRef = useRef<string | null>(currentVideoRefId);
  const prevVideoKeyRef = useRef<string | null>(null);

  // Resume tracking refs
  const resumePositionRef = useRef<number | null>(null);
  const resumeAppliedRef = useRef<boolean>(false);
  const isCompletedRef = useRef<boolean>(false);

  // Keep currentVideoRef in sync on every render
  currentVideoRef.current = currentVideoRefId;

  // Resolve video reference ID with all possible fallbacks
  const resolveVideoRefId = useCallback((): string | null => {
    const raw =
      currentVideoRef.current ||
      currentVideoRefId ||
      video?.videoRefId ||
      (video as any)?.video_ref_id ||
      video?.id ||
      (video as any)?.videoId ||
      (video as any)?.video_id ||
      (video as any)?.refId ||
      (video as any)?.uuid;
    return raw ? String(raw).trim() : null;
  }, [currentVideoRefId, video]);

  // Dedicated function: immediately saves position when user presses Pause
  const saveProgressOnPause = useCallback(
    async (explicitPosition?: number) => {
      console.log("[VIDEO PROGRESS] PAUSE SAVE START");

      const videoEl = htmlVideoRef.current || videoRef.current;
      if (!videoEl) {
        if (source.type === "google-drive") {
          console.log("[GOOGLE DRIVE] VIDEO ELEMENT NOT FOUND");
        }
        console.error("[VIDEO PROGRESS] PAUSE: VIDEO NOT FOUND");
        return;
      }

      // If video has ended, completion handler is authoritative
      if (videoEl.ended || finalProgressSentRef.current) {
        return;
      }

      const rawTime =
        typeof explicitPosition === "number"
          ? explicitPosition
          : videoEl.currentTime;

      if (!Number.isFinite(rawTime) || rawTime < 0) {
        return;
      }

      const currentPosition = Math.floor(rawTime);
      console.log(`[VIDEO PROGRESS] PAUSE POSITION: ${currentPosition}`);
      if (source.type === "google-drive") {
        console.log("[GOOGLE DRIVE] CURRENT TIME", currentPosition);
      }

      const videoRefId = resolveVideoRefId();
      if (!videoRefId) {
        console.error("[VIDEO PROGRESS] PAUSE: VIDEO REF ID MISSING");
        return;
      }

      // If a request is already running, queue this latest pause position so pause always wins
      if (progressRequestInFlightRef.current) {
        console.log(
          "[VIDEO PROGRESS] PAUSE: REQUEST ALREADY RUNNING, QUEUEING PAUSE POSITION",
          currentPosition,
        );
        pendingPausePositionRef.current = currentPosition;
        return;
      }

      const totalDur = Math.floor(
        videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0
          ? videoEl.duration
          : duration ||
              (video as any)?.durationSec ||
              (video as any)?.duration ||
              0,
      );

      const payload = {
        videoRefId: String(videoRefId),
        lastWatchedDuration: currentPosition,
        videoDuration: totalDur,
        isCompleted: totalDur > 0 && currentPosition >= totalDur,
      };

      progressRequestInFlightRef.current = true;
      console.log("[VIDEO PROGRESS] PAUSE API CALL", payload);
      if (source.type === "google-drive") {
        console.log("[GOOGLE DRIVE] API CALL", payload);
      }

      try {
        await videoService.createVideoProgress(payload);
        lastSavedPositionRef.current = currentPosition;
        lastCheckedPositionRef.current = currentPosition;
        prevTickPositionRef.current = currentPosition;
        if (source.type === "google-drive") {
          console.log("[GOOGLE DRIVE] API SUCCESS", currentPosition);
        }
        console.log(`[VIDEO PROGRESS] PAUSE API SUCCESS: ${currentPosition}`);
      } catch (error) {
        if (source.type === "google-drive") {
          console.error("[GOOGLE DRIVE] API ERROR", error);
        }
        console.error("[VIDEO PROGRESS] PAUSE API ERROR", error);
      } finally {
        progressRequestInFlightRef.current = false;
        if (pendingPausePositionRef.current !== null) {
          const nextPos = pendingPausePositionRef.current;
          pendingPausePositionRef.current = null;
          void saveProgressOnPause(nextPos);
        }
      }
    },
    [source.type, resolveVideoRefId, duration, video],
  );

  // Single central function responsible for createVideoProgress API call
  const sendVideoProgress = useCallback(
    async (position: number, isFinal = false) => {
      if (progressRequestInFlightRef.current) {
        return;
      }

      const videoRefId = resolveVideoRefId();
      if (!videoRefId) {
        console.warn("[VIDEO PROGRESS] Missing videoRefId");
        return;
      }

      const videoEl = htmlVideoRef.current || videoRef.current;
      const totalDur = Math.floor(
        videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0
          ? videoEl.duration
          : duration ||
              (video as any)?.durationSec ||
              (video as any)?.duration ||
              0,
      );

      const safePosition = Math.max(0, Math.floor(position));
      const payload = {
        videoRefId: String(videoRefId),
        lastWatchedDuration: safePosition,
        videoDuration: totalDur,
        isCompleted: isFinal || (totalDur > 0 && safePosition >= totalDur),
      };

      progressRequestInFlightRef.current = true;
      console.log("[VIDEO PROGRESS] API CALL", payload);
      if (source.type === "google-drive") {
        console.log("[GOOGLE DRIVE] API CALL", payload);
      }

      try {
        await videoService.createVideoProgress(payload);
        lastSavedPositionRef.current = safePosition;
        if (source.type === "google-drive") {
          console.log("[GOOGLE DRIVE] API SUCCESS", safePosition);
        }
        console.log("[VIDEO PROGRESS] API SUCCESS", safePosition);
      } catch (error) {
        if (source.type === "google-drive") {
          console.error("[GOOGLE DRIVE] API ERROR", error);
        }
        console.error("[VIDEO PROGRESS] API ERROR", error);
      } finally {
        progressRequestInFlightRef.current = false;
        if (pendingPausePositionRef.current !== null) {
          const nextPos = pendingPausePositionRef.current;
          pendingPausePositionRef.current = null;
          void saveProgressOnPause(nextPos);
        }
      }
    },
    [source.type, resolveVideoRefId, duration, video, saveProgressOnPause],
  );

  // Central 1-second interval tracker with 5-second checkpoint condition
  const trackVideoProgress = useCallback(() => {
    console.log("[VIDEO PROGRESS] TRACK CALLED");

    const videoEl = htmlVideoRef.current || videoRef.current;
    console.log("[VIDEO PROGRESS] VIDEO ELEMENT", videoEl);

    if (source.type === "google-drive") {
      if (htmlVideoRef.current) {
        console.log("[GOOGLE DRIVE] VIDEO ELEMENT", htmlVideoRef.current);
      } else {
        console.log("[GOOGLE DRIVE] VIDEO ELEMENT NOT FOUND");
      }
    }

    if (!videoEl) {
      return;
    }

    if (videoEl.paused || videoEl.ended) {
      return;
    }

    // Advance Google Drive timer position while playing
    if (source.type === "google-drive" && isDrivePlayingRef.current) {
      driveTimeRef.current += 1;
      setCurrent(driveTimeRef.current);
      latestCurrentTimeRef.current = driveTimeRef.current;
    }

    const rawTime = videoEl.currentTime;
    if (!Number.isFinite(rawTime) || rawTime < 0) {
      return;
    }

    const currentPosition = Math.floor(rawTime);
    console.log("[VIDEO PROGRESS] CURRENT POSITION", currentPosition);
    console.log(
      "[VIDEO PROGRESS] LAST SAVED POSITION",
      lastSavedPositionRef.current,
    );

    if (source.type === "google-drive") {
      console.log("[GOOGLE DRIVE] CURRENT TIME", currentPosition);
      const dur = Math.floor(videoEl.duration || duration || 0);
      console.log("[GOOGLE DRIVE] VIDEO DURATION", dur);
    }

    // Detect jump/seek between 1-second ticks
    const tickDelta = currentPosition - prevTickPositionRef.current;
    if (tickDelta < 0 || tickDelta > 3) {
      lastCheckedPositionRef.current = currentPosition;
    }
    prevTickPositionRef.current = currentPosition;

    const unsavedDuration = Math.max(
      0,
      currentPosition - lastCheckedPositionRef.current,
    );
    console.log("[VIDEO PROGRESS] UNSAVED DURATION", unsavedDuration);

    if (source.type === "google-drive") {
      console.log("[GOOGLE DRIVE] TRACK PROGRESS", {
        currentPosition,
        lastSaved: lastSavedPositionRef.current,
        unsavedDuration,
      });
    }

    const videoRefId = resolveVideoRefId();
    console.log("[VIDEO PROGRESS] VIDEO REF ID", videoRefId);

    // Checkpoint condition: 5 new seconds of continuous playback accumulated
    if (unsavedDuration >= 5) {
      if (progressRequestInFlightRef.current) {
        return;
      }

      lastCheckedPositionRef.current = currentPosition;
      void sendVideoProgress(currentPosition, false);
    }
  }, [source.type, duration, resolveVideoRefId, sendVideoProgress]);

  // Keep ref to latest trackVideoProgress callback to avoid stale interval closures
  const savedTrackCallback = useRef<() => void>(() => {});
  savedTrackCallback.current = trackVideoProgress;

  // Stop tracking timer safely
  const stopProgressTracking = useCallback(() => {
    console.log("[VIDEO PROGRESS] STOP TRACKING");

    if (progressTimerRef.current !== null) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Start tracking timer
  const startProgressTracking = useCallback(() => {
    if (source.type === "google-drive") {
      console.log("[GOOGLE DRIVE] START PROGRESS TRACKING");
    }
    console.log("[VIDEO PROGRESS] START TRACKING");

    if (progressTimerRef.current !== null) {
      return;
    }

    progressTimerRef.current = setInterval(() => {
      console.log("[VIDEO PROGRESS] TIMER TICK");
      savedTrackCallback.current();
    }, 1000);

    console.log("[VIDEO PROGRESS] TIMER CREATED");
  }, [source.type]);

  // Play handler
  const handlePlay = useCallback(() => {
    if (source.type === "google-drive") {
      isDrivePlayingRef.current = true;
      console.log("[GOOGLE DRIVE] PLAY");
      if (htmlVideoRef.current) {
        console.log("[GOOGLE DRIVE] VIDEO ELEMENT", htmlVideoRef.current);
      } else {
        console.log("[GOOGLE DRIVE] VIDEO ELEMENT NOT FOUND");
      }
    }
    console.log("[VIDEO PROGRESS] PLAY");
    setPlaying(true);
    isPlayingRef.current = true;
    isYtPlayingRef.current = true;
    startProgressTracking();
  }, [source.type, startProgressTracking]);

  // Pause handler: stops tracking and immediately saves exact current position
  const handlePause = useCallback(() => {
    if (source.type === "google-drive") {
      isDrivePlayingRef.current = false;
      console.log("[GOOGLE DRIVE] PAUSE");
    }
    console.log("[VIDEO] PAUSE EVENT");
    console.log("[VIDEO PROGRESS] PAUSE");
    setPlaying(false);
    isPlayingRef.current = false;
    isYtPlayingRef.current = false;
    stopProgressTracking();
    void saveProgressOnPause();
  }, [source.type, stopProgressTracking, saveProgressOnPause]);

  // Video end handler: sends final completed progress and stops timer
  const handleEnded = useCallback(() => {
    if (source.type === "google-drive") {
      isDrivePlayingRef.current = false;
      isDriveEndedRef.current = true;
      console.log("[GOOGLE DRIVE] END");
    }
    console.log("[VIDEO PROGRESS] END");
    setPlaying(false);
    isPlayingRef.current = false;
    isYtPlayingRef.current = false;
    stopProgressTracking();

    if (finalProgressSentRef.current) {
      return;
    }
    finalProgressSentRef.current = true;

    const videoEl = htmlVideoRef.current || videoRef.current;
    const finalDuration =
      videoEl && Number.isFinite(videoEl.duration) && videoEl.duration > 0
        ? Math.floor(videoEl.duration)
        : Math.floor(lastSavedPositionRef.current);

    void sendVideoProgress(finalDuration, true);
  }, [source.type, stopProgressTracking, sendVideoProgress]);

  // Seeking handler: synchronizes base reference checkpoint without breaking tracker
  const handleSeek = useCallback(
    (newTime: number) => {
      const clamped = Math.max(0, Math.floor(newTime));

      lastCheckedPositionRef.current = clamped;
      prevTickPositionRef.current = clamped;

      if (source.type === "google-drive") {
        driveTimeRef.current = clamped;
        console.log("[GOOGLE DRIVE] SEEK", clamped);
      }
      console.log(
        "[VIDEO PROGRESS] SEEK",
        clamped,
        "LAST SAVED:",
        lastSavedPositionRef.current,
      );
    },
    [source.type],
  );

  // Dedicated resume function: applies saved position once source & metadata are ready
  const applyResumePosition = useCallback(() => {
    if (resumeAppliedRef.current) {
      console.log("[VIDEO RESUME] ALREADY APPLIED");
      return;
    }

    if (resumePositionRef.current === null) {
      console.log("[VIDEO RESUME] NO SAVED POSITION");
      return;
    }

    const savedPosition = Number(resumePositionRef.current);
    if (!Number.isFinite(savedPosition) || savedPosition <= 0) {
      console.log("[VIDEO RESUME] NO SAVED POSITION");
      resumeAppliedRef.current = true;
      return;
    }

    // 1. YouTube Provider (PRESERVED UNCHANGED)
    if (source.type === "youtube") {
      if (isCompletedRef.current) {
        try {
          ytPlayerRef.current?.seekTo?.(0, true);
        } catch {}
        resumeAppliedRef.current = true;
        return;
      }

      if (
        ytPlayerRef.current &&
        typeof ytPlayerRef.current.seekTo === "function"
      ) {
        let ytDuration = 0;
        try {
          const d = ytPlayerRef.current.getDuration?.();
          if (typeof d === "number" && Number.isFinite(d)) {
            ytDuration = d;
          }
        } catch {}

        if (ytDuration > 0) {
          console.log("[VIDEO RESUME] VIDEO DURATION", ytDuration);
        }

        const safePosition =
          ytDuration > 0
            ? Math.min(savedPosition, Math.max(0, ytDuration - 0.5))
            : savedPosition;

        console.log(`[VIDEO RESUME] APPLYING POSITION: ${safePosition}`);
        try {
          ytPlayerRef.current.seekTo(safePosition, true);
          ytTimeRef.current = safePosition;
          latestCurrentTimeRef.current = safePosition;
          lastSavedPositionRef.current = Math.floor(safePosition);
          lastCheckedPositionRef.current = Math.floor(safePosition);
          prevTickPositionRef.current = Math.floor(safePosition);
          console.log(`[VIDEO RESUME] RESUMED FROM: ${safePosition}`);
          resumeAppliedRef.current = true;
        } catch (err) {
          console.warn("[VIDEO RESUME] Unable to apply saved position", err);
        }
      } else {
        console.log("[VIDEO RESUME] VIDEO NOT READY");
      }
      return;
    }

    // 2. HTML5 Video Element (Direct, HLS, DASH, or Google Drive when rendered in HTML5 video)
    const videoEl = htmlVideoRef.current;
    if (videoEl) {
      if (
        videoEl.readyState < 1 ||
        !Number.isFinite(videoEl.duration) ||
        videoEl.duration <= 0
      ) {
        console.log("[VIDEO RESUME] VIDEO NOT READY");
        return;
      }

      const totalDur = videoEl.duration;
      console.log("[VIDEO RESUME] VIDEO DURATION", totalDur);

      if (isCompletedRef.current || (totalDur > 0 && savedPosition >= totalDur)) {
        console.log("[VIDEO RESUME] VIDEO ALREADY COMPLETED, STARTING AT 0");
        videoEl.currentTime = 0;
        setCurrent(0);
        resumeAppliedRef.current = true;
        return;
      }

      const safePosition = Math.min(
        savedPosition,
        Math.max(0, totalDur - 0.5),
      );

      console.log(`[VIDEO RESUME] APPLYING POSITION: ${safePosition}`);
      videoEl.currentTime = safePosition;
      setCurrent(safePosition);
      latestCurrentTimeRef.current = safePosition;
      lastSavedPositionRef.current = Math.floor(safePosition);
      lastCheckedPositionRef.current = Math.floor(safePosition);
      prevTickPositionRef.current = Math.floor(safePosition);
      console.log(`[VIDEO RESUME] RESUMED FROM: ${safePosition}`);
      resumeAppliedRef.current = true;
      return;
    }

    // 3. Google Drive preview iframe adapter (when HTML5 video element is not mounted)
    if (source.type === "google-drive") {
      console.log(`[VIDEO RESUME] APPLYING POSITION: ${savedPosition}`);
      driveTimeRef.current = savedPosition;
      setCurrent(savedPosition);
      latestCurrentTimeRef.current = savedPosition;
      lastSavedPositionRef.current = Math.floor(savedPosition);
      lastCheckedPositionRef.current = Math.floor(savedPosition);
      prevTickPositionRef.current = Math.floor(savedPosition);
      console.log(`[VIDEO RESUME] RESUMED FROM: ${savedPosition}`);
      resumeAppliedRef.current = true;
      return;
    }

    console.log("[VIDEO RESUME] VIDEO NOT READY");
  }, [source.type]);

  // Dedicated cleanup on component unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      progressRequestInFlightRef.current = false;
      isPlayingRef.current = false;
      isYtPlayingRef.current = false;
    };
  }, [stopProgressTracking]);

  // Log unsupported sources without leaking tokens
  useEffect(() => {
    if (source.type === "unknown" && videoUrl) {
      console.error("Unsupported video source", {
        url: sanitizeVideoUrlForLogging(videoUrl),
        sourceType: source.type,
      });
    }
  }, [source.type, videoUrl]);

  // NEW VIDEO: Reset tracking & load new progress when video changes
  useEffect(() => {
    const vRefId = resolveVideoRefId();
    const videoKey = `${vRefId || ""}-${videoUrl || ""}`;
    if (videoKey === prevVideoKeyRef.current) {
      return;
    }
    prevVideoKeyRef.current = videoKey;

    if (source.type === "google-drive") {
      console.log("[GOOGLE DRIVE] LOAD", {
        url: sanitizeVideoUrlForLogging(videoUrl),
        videoId: source.videoId,
      });
    }
    console.log("[VIDEO PROGRESS] VIDEO CHANGED");
    stopProgressTracking();
    progressRequestInFlightRef.current = false;
    pendingPausePositionRef.current = null;
    resumeAppliedRef.current = false;
    resumePositionRef.current = null;
    isCompletedRef.current = false;
    lastSavedPositionRef.current = 0;
    lastCheckedPositionRef.current = 0;
    prevTickPositionRef.current = 0;
    latestCurrentTimeRef.current = 0;
    latestDurationRef.current = 0;
    finalProgressSentRef.current = false;

    // Reset Google Drive refs
    driveTimeRef.current = 0;
    isDrivePlayingRef.current = false;
    isDriveEndedRef.current = false;

    // Reset UI playback states
    setIframeError(false);
    setError(null);
    setPlaying(false);
    isPlayingRef.current = false;
    isYtPlayingRef.current = false;
    setCurrent(0);
    setDuration(0);
    setSavedProgress(null);

    console.log("VIDEO URL:", sanitizeVideoUrlForLogging(videoUrl));
    console.log("VIDEO TYPE:", source.type);

    if (!vRefId) {
      return;
    }

    let active = true;
    void videoService
      .getVideoProgress(vRefId)
      .then((progress) => {
        if (!active) return;
        console.log("[VIDEO RESUME] PROGRESS RESPONSE", progress);
        setSavedProgress(progress);
        if (progress) {
          const rawDuration =
            progress.lastWatchedDuration ??
            (progress as any)?.last_watched_duration;
          const parsed = Number(rawDuration);
          const durationVal = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
          resumePositionRef.current = durationVal;
          isCompletedRef.current = Boolean(progress.isCompleted);
          if (durationVal > 0) {
            console.log(`[VIDEO RESUME] SAVED POSITION: ${durationVal}`);
            lastSavedPositionRef.current = Math.floor(durationVal);
            lastCheckedPositionRef.current = Math.floor(durationVal);
            prevTickPositionRef.current = Math.floor(durationVal);
            driveTimeRef.current = Math.floor(durationVal);
          } else {
            console.log("[VIDEO RESUME] NO SAVED POSITION");
          }
        } else {
          console.log("[VIDEO RESUME] NO SAVED POSITION");
          resumePositionRef.current = 0;
          isCompletedRef.current = false;
        }
        applyResumePosition();
      })
      .catch((err) => {
        console.warn("Failed to load video progress:", err);
        if (active) {
          console.log("[VIDEO RESUME] NO SAVED POSITION");
          resumePositionRef.current = 0;
          isCompletedRef.current = false;
          applyResumePosition();
        }
      });

    return () => {
      active = false;
    };
  }, [currentVideoRefId, videoUrl, source.type, source.videoId, resolveVideoRefId, stopProgressTracking, applyResumePosition]);

  // Provide Google Drive and YouTube adapters to videoRef
  useEffect(() => {
    if (source.type === "google-drive") {
      videoRef.current = {
        get currentTime() {
          return driveTimeRef.current;
        },
        get duration() {
          return (
            duration ||
            (video as any)?.durationSec ||
            (video as any)?.duration ||
            0
          );
        },
        get paused() {
          return !isDrivePlayingRef.current;
        },
        get ended() {
          return isDriveEndedRef.current;
        },
      };
    } else if (source.type === "youtube") {
      videoRef.current = {
        get currentTime() {
          if (
            ytPlayerRef.current &&
            typeof ytPlayerRef.current.getCurrentTime === "function"
          ) {
            try {
              const t = ytPlayerRef.current.getCurrentTime();
              if (typeof t === "number" && !isNaN(t)) {
                latestCurrentTimeRef.current = t;
                return t;
              }
            } catch {}
          }
          return ytTimeRef.current;
        },
        get duration() {
          if (
            ytPlayerRef.current &&
            typeof ytPlayerRef.current.getDuration === "function"
          ) {
            try {
              const d = ytPlayerRef.current.getDuration();
              if (typeof d === "number" && !isNaN(d)) {
                latestDurationRef.current = d;
                return d;
              }
            } catch {}
          }
          return ytDurationRef.current;
        },
        get paused() {
          if (
            ytPlayerRef.current &&
            typeof ytPlayerRef.current.getPlayerState === "function"
          ) {
            try {
              const state = ytPlayerRef.current.getPlayerState();
              return state !== 1;
            } catch {}
          }
          return !isYtPlayingRef.current;
        },
        get ended() {
          if (
            ytPlayerRef.current &&
            typeof ytPlayerRef.current.getPlayerState === "function"
          ) {
            try {
              return ytPlayerRef.current.getPlayerState() === 0;
            } catch {}
          }
          return false;
        },
      };
    }
  }, [source.type, duration, video]);

  // Google Drive interaction detection: automatically tracks playback when user interacts with iframe
  useEffect(() => {
    if (source.type !== "google-drive") return;

    const onWindowBlur = () => {
      // User clicked into the Google Drive iframe to play
      if (document.activeElement === iframeRef.current) {
        if (!isDrivePlayingRef.current) {
          isDrivePlayingRef.current = true;
          setPlaying(true);
          isPlayingRef.current = true;
          handlePlay();
        }
      }
    };

    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [source.type, handlePlay]);

  // YouTube postMessage and IFrame API listeners (PRESERVED UNCHANGED)
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
            ytTimeRef.current = data.info.currentTime;
            latestCurrentTimeRef.current = data.info.currentTime;
          }
          if (typeof data.info.duration === "number") {
            ytDurationRef.current = data.info.duration;
            latestDurationRef.current = data.info.duration;
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);

    const initYt = () => {
      if (!iframeRef.current || !active) return;
      try {
        const YT = (window as any).YT;
        if (YT && YT.Player) {
          ytPlayerRef.current = new YT.Player(iframeRef.current, {
            events: {
              onReady: (event: any) => {
                console.log("YOUTUBE PLAYER READY");
                ytPlayerRef.current = event.target;
                applyResumePosition();
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

    if (typeof window !== "undefined") {
      if ((window as any).YT && (window as any).YT.Player) {
        initYt();
      } else {
        const existingCallback = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
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
      } catch {}
      ytPlayerRef.current = null;
    };
  }, [
    source.type,
    source.videoId,
    handlePlay,
    handlePause,
    handleEnded,
    applyResumePosition,
  ]);

  // Synchronize resume position for YouTube when savedProgress loads after player initialization (PRESERVED UNCHANGED)
  useEffect(() => {
    if (
      source.type === "youtube" &&
      !resumeAppliedRef.current &&
      savedProgress
    ) {
      applyResumePosition();
    }
  }, [savedProgress, source.type, applyResumePosition]);

  // HLS stream attachment when source is .m3u8
  useEffect(() => {
    if (source.type !== "hls" || !htmlVideoRef.current) return;
    const v = htmlVideoRef.current;

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = source.url;
    } else if (
      typeof window !== "undefined" &&
      (window as any).Hls &&
      (window as any).Hls.isSupported()
    ) {
      const Hls = (window as any).Hls;
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

    console.log("[VIDEO RESUME] VIDEO METADATA READY");
    console.log("[VIDEO RESUME] VIDEO DURATION", totalDuration);
    console.log("VIDEO METADATA LOADED", {
      duration: totalDuration,
    });

    applyResumePosition();
  };

  // Synchronize resume position for HTML5 when savedProgress loads after metadata already loaded
  useEffect(() => {
    if (!resumeAppliedRef.current && savedProgress) {
      applyResumePosition();
    }
  }, [savedProgress, applyResumePosition]);

  // HTML5 custom controls handlers: calling v.pause() fires native onPause
  const togglePlay = useCallback(() => {
    if (source.type === "google-drive") {
      if (playing) {
        handlePause();
      } else {
        handlePlay();
      }
      return;
    }

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
          console.error("VIDEO PLAYBACK ERROR", {
            sourceType: source.type,
            url: sanitizeVideoUrlForLogging(videoUrl),
            error: playbackErr,
          });
          setError("Unable to play this video.");
        });
    } else {
      v.pause();
    }
  }, [source.type, playing, handlePlay, handlePause, videoUrl]);

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = (Number(e.target.value) / 100) * duration;
    setCurrent(t);
    latestCurrentTimeRef.current = t;
    if (source.type === "google-drive") {
      driveTimeRef.current = t;
    }
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
    if (source.type === "google-drive") {
      driveTimeRef.current = nextTime;
    }
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
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Anti-recording shortcut protections
  useEffect(() => {
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
    containerRef.current?.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey);
    return () => {
      containerRef.current?.removeEventListener("contextmenu", onContext);
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
      {/* 1. YouTube Player (PRESERVED UNCHANGED) */}
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
                : 0,
            )}
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={(e) => {
              console.error("VIDEO PLAYBACK ERROR", {
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
              <p className="text-sm font-medium">Unable to play this video.</p>
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
              console.error("VIDEO PLAYBACK ERROR", {
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
              <p className="text-sm font-medium">Unable to play this video.</p>
            </div>
          )}
        </>
      ) : null}

      {/* 3. Google Drive Player (Plays via official Google Drive preview embed) */}
      {source.type === "google-drive" && source.videoId ? (
        <>
          <iframe
            ref={iframeRef}
            src={
              source.previewUrl
                ? (savedProgress && !savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0
                    ? `${source.previewUrl}#t=${savedProgress.lastWatchedDuration}s`
                    : source.previewUrl)
                : `https://drive.google.com/file/d/${source.videoId}/preview${
                    savedProgress && !savedProgress.isCompleted && savedProgress.lastWatchedDuration > 0
                      ? `#t=${savedProgress.lastWatchedDuration}s`
                      : ""
                  }`
            }
            title={displayTitle}
            className="h-full w-full border-0 block"
            allow="autoplay; fullscreen"
            allowFullScreen
            onError={(e) => {
              console.error("VIDEO PLAYBACK ERROR", {
                sourceType: "google-drive",
                url: sanitizeVideoUrlForLogging(videoUrl),
                error: e,
              });
              setIframeError(true);
            }}
          />
          {iframeError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-white">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium">Unable to play this video.</p>
            </div>
          )}
        </>
      ) : null}

      {/* 4. Native Video Player (Direct / S3 / CloudFront / CDN / HLS / DASH) */}
      {isNativeVideo ? (
        <>
          <video
            ref={(el) => {
              htmlVideoRef.current = el;
              videoRef.current = el;
            }}
            src={source.type === "hls" ? undefined : source.url}
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
              console.error("VIDEO PLAYBACK ERROR", {
                sourceType: source.type,
                url: sanitizeVideoUrlForLogging(videoUrl),
                error: e,
              });
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
