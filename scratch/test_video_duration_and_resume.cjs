// scratch/test_video_duration_and_resume.cjs
const assert = require('assert');

console.log("=== RUNNING VIDEO DURATION AND RESUME PLAYBACK TESTS ===");

function createPlayerHarness(initialRefId = "test-video-ref-1") {
  const logs = [];
  const apiCalls = [];

  const htmlVideo = {
    currentTime: 0,
    duration: NaN,
    readyState: 0,
    paused: true,
    ended: false,
  };

  let currentVideoRefId = initialRefId;
  const resumeAppliedRef = { current: false };
  const resumePositionRef = { current: null };
  const isCompletedRef = { current: false };
  const pendingProgressPositionRef = { current: null };
  const pendingPauseFlagRef = { current: false };
  const progressRequestInFlightRef = { current: false };

  function getVideoDuration() {
    logs.push(`[VIDEO DURATION] VIDEO ELEMENT`);
    const raw = Number(htmlVideo.duration);
    if (!Number.isFinite(raw) || raw <= 0) {
      logs.push(`[VIDEO DURATION] INVALID DURATION ${raw}`);
      return null;
    }
    logs.push(`[VIDEO DURATION] CURRENT DURATION ${Math.floor(raw)}`);
    return Math.floor(raw);
  }

  function applyResumePosition() {
    if (resumeAppliedRef.current) {
      logs.push("[VIDEO RESUME] ALREADY APPLIED");
      return;
    }

    if (resumePositionRef.current === null) {
      logs.push("[VIDEO RESUME] NO SAVED POSITION");
      return;
    }

    const savedPosition = Number(resumePositionRef.current);
    if (!Number.isFinite(savedPosition) || savedPosition <= 0) {
      logs.push("[VIDEO RESUME] NO SAVED POSITION");
      resumeAppliedRef.current = true;
      return;
    }

    const video = htmlVideo;
    if (video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) {
      logs.push("[VIDEO RESUME] VIDEO NOT READY");
      return;
    }

    const totalDur = video.duration;
    logs.push("[VIDEO RESUME] VIDEO READY");
    logs.push(`[VIDEO RESUME] VIDEO DURATION ${totalDur}`);

    if (isCompletedRef.current || (totalDur > 0 && savedPosition >= totalDur)) {
      video.currentTime = 0;
      resumeAppliedRef.current = true;
      return;
    }

    const safePosition = Math.min(
      savedPosition,
      Math.max(0, totalDur - 0.5)
    );

    logs.push(`[VIDEO RESUME] APPLY POSITION ${safePosition}`);
    video.currentTime = safePosition;
    logs.push(`[VIDEO RESUME] RESUMED FROM ${safePosition}`);
    resumeAppliedRef.current = true;
  }

  async function sendVideoProgressWithDuration(pos, dur, isPause, isFinal = false) {
    if (dur <= 0) {
      logs.push("[VIDEO PROGRESS] CANNOT SEND API WITH DURATION 0");
      return;
    }

    const payload = {
      videoRefId: currentVideoRefId,
      lastWatchedDuration: Math.floor(pos),
      videoDuration: Math.floor(dur),
      isCompleted: isFinal || (dur > 0 && pos >= dur),
    };

    logs.push(`[VIDEO PROGRESS] CURRENT POSITION ${pos}`);
    logs.push(`[VIDEO PROGRESS] VIDEO DURATION ${dur}`);
    logs.push(`[VIDEO PROGRESS] API CALL ${JSON.stringify(payload)}`);

    apiCalls.push(payload);
    logs.push(`[VIDEO PROGRESS] API SUCCESS ${pos}`);
  }

  function handleLoadedMetadata(dur) {
    htmlVideo.duration = dur;
    htmlVideo.readyState = 1;
    logs.push(`[VIDEO DURATION] LOADED METADATA ${{ duration: dur }}`);
    logs.push(`[VIDEO DURATION] CURRENT DURATION ${dur}`);
    logs.push("[VIDEO RESUME] VIDEO READY");

    if (pendingProgressPositionRef.current !== null) {
      const pos = pendingProgressPositionRef.current;
      const isPause = pendingPauseFlagRef.current;
      pendingProgressPositionRef.current = null;
      pendingPauseFlagRef.current = false;
      void sendVideoProgressWithDuration(pos, dur, isPause, false);
    }

    applyResumePosition();
  }

  function handleProgressResponse(progress) {
    if (progress) {
      const raw = progress.lastWatchedDuration;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        resumePositionRef.current = parsed;
        logs.push(`[VIDEO RESUME] SAVED POSITION ${parsed}`);
      } else {
        resumePositionRef.current = 0;
        logs.push("[VIDEO RESUME] NO SAVED POSITION");
      }
      isCompletedRef.current = Boolean(progress.isCompleted);
    } else {
      resumePositionRef.current = 0;
      logs.push("[VIDEO RESUME] NO SAVED POSITION");
      isCompletedRef.current = false;
    }
    applyResumePosition();
  }

  function pauseAt(pos) {
    htmlVideo.currentTime = pos;
    const dur = getVideoDuration();
    if (!dur || dur <= 0) {
      logs.push(`[VIDEO PROGRESS] DURATION NOT READY - SAVING PENDING PAUSE POSITION: ${pos}`);
      pendingProgressPositionRef.current = pos;
      pendingPauseFlagRef.current = true;
      return;
    }
    void sendVideoProgressWithDuration(pos, dur, true, false);
  }

  return {
    logs,
    apiCalls,
    htmlVideo,
    getVideoDuration,
    applyResumePosition,
    handleLoadedMetadata,
    handleProgressResponse,
    pauseAt,
    pendingProgressPositionRef,
  };
}

// TEST 1: Open video -> metadata fires -> duration > 0 detected
{
  const h = createPlayerHarness();
  assert.strictEqual(h.getVideoDuration(), null, "Duration must be null before metadata");
  h.handleLoadedMetadata(523);
  assert.strictEqual(h.getVideoDuration(), 523, "Duration must be 523 after metadata");
  console.log("PASS: TEST 1 - Metadata event fires and duration > 0 is detected");
}

// TEST 2: Play to 90 seconds -> pause -> API sends actual duration (NOT 0)
{
  const h = createPlayerHarness();
  h.handleLoadedMetadata(523);
  h.pauseAt(90);

  assert.strictEqual(h.apiCalls.length, 1);
  assert.deepStrictEqual(h.apiCalls[0], {
    videoRefId: "test-video-ref-1",
    lastWatchedDuration: 90,
    videoDuration: 523,
    isCompleted: false,
  });
  assert.notStrictEqual(h.apiCalls[0].videoDuration, 0, "videoDuration must never be 0");
  console.log("PASS: TEST 2 - Pause at 90s sends actual videoDuration = 523");
}

// TEST 3: Close video, open again -> backend progress is 90 -> resumes from 90
{
  const h = createPlayerHarness();
  // Case A: progress response arrives first, then metadata
  h.handleProgressResponse({ lastWatchedDuration: 90, videoDuration: 523, isCompleted: false });
  assert.strictEqual(h.htmlVideo.currentTime, 0, "Video must wait for metadata before seeking");
  h.handleLoadedMetadata(523);
  assert.strictEqual(h.htmlVideo.currentTime, 90, "Video must resume from 90s");

  // Verify required logs
  assert.ok(h.logs.some(l => l.includes("[VIDEO RESUME] SAVED POSITION 90")));
  assert.ok(h.logs.some(l => l.includes("[VIDEO RESUME] APPLY POSITION 90")));
  assert.ok(h.logs.some(l => l.includes("[VIDEO RESUME] RESUMED FROM 90")));
  console.log("PASS: TEST 3 - Video successfully resumes from 90 seconds after metadata is ready");
}

// TEST 4: Case B: metadata arrives first, progress arrives later -> resumes from 90
{
  const h = createPlayerHarness();
  h.handleLoadedMetadata(523);
  assert.strictEqual(h.htmlVideo.currentTime, 0);
  h.handleProgressResponse({ lastWatchedDuration: 90, videoDuration: 523, isCompleted: false });
  assert.strictEqual(h.htmlVideo.currentTime, 90, "Video must resume from 90s in Case B");
  console.log("PASS: TEST 4 - Scenario B (metadata first, progress later) resumes from 90s");
}

// TEST 5: If pause happens BEFORE duration is ready, do NOT send videoDuration: 0, wait and send when metadata arrives!
{
  const h = createPlayerHarness();
  // User pauses at 90s before metadata has arrived
  h.pauseAt(90);
  assert.strictEqual(h.apiCalls.length, 0, "API must NOT be called with videoDuration = 0");
  assert.strictEqual(h.pendingProgressPositionRef.current, 90, "Pending position must be kept");

  // Metadata arrives later (e.g. 523)
  h.handleLoadedMetadata(523);
  assert.strictEqual(h.apiCalls.length, 1, "Pending progress must be flushed immediately with duration");
  assert.deepStrictEqual(h.apiCalls[0], {
    videoRefId: "test-video-ref-1",
    lastWatchedDuration: 90,
    videoDuration: 523,
    isCompleted: false,
  });
  console.log("PASS: TEST 5 - Progress before metadata is queued and sent with actual duration (never 0)");
}

// TEST 6: Seek to 200 -> pause -> sends 200 with duration
{
  const h = createPlayerHarness();
  h.handleLoadedMetadata(523);
  h.pauseAt(200);
  assert.strictEqual(h.apiCalls[0].lastWatchedDuration, 200);
  assert.strictEqual(h.apiCalls[0].videoDuration, 523);
  console.log("PASS: TEST 6 - Seek to 200 and pause sends lastWatchedDuration: 200, videoDuration: 523");
}

console.log("\n=======================================================");
console.log(" ALL DURATION & RESUME TESTS PASSED! ");
console.log("=======================================================\n");
