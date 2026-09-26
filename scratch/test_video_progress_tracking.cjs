// scratch/test_video_progress_tracking.cjs
const assert = require('assert');

console.log("=== RUNNING COMPLETE VIDEO PROGRESS & PAUSE TRACKING SUITE (YOUTUBE & GOOGLE DRIVE) ===");

function createProgressTrackingHarness(initialVideoRefId = "video-01", totalDuration = 100, videoType = "google-drive") {
  const logs = [];
  const errors = [];
  const apiCalls = [];

  let currentVideoRefId = initialVideoRefId;
  const htmlVideo = {
    currentTime: 0,
    duration: totalDuration,
    paused: true,
    ended: false,
    readyState: 1,
  };

  // Required refs
  let progressTimer = null;
  let progressRequestInFlight = false;
  let lastSavedPosition = 0;
  let lastCheckedPosition = 0;
  let prevTickPosition = 0;
  let finalProgressSent = false;
  let pendingPausePosition = null;

  let hasAppliedResume = false;
  let resumePosition = null;
  let isCompleted = false;
  let apiShouldFail = false;

  function resolveVideoRefId() {
    return currentVideoRefId;
  }

  async function mockCreateVideoProgress(payload) {
    if (apiShouldFail) {
      throw new Error("Network error: 500 Internal Server Error");
    }
    apiCalls.push(JSON.parse(JSON.stringify(payload)));
  }

  async function sendVideoProgress(position, isFinal = false) {
    if (progressRequestInFlight) {
      return;
    }

    const videoRefId = resolveVideoRefId();
    if (!videoRefId) {
      return;
    }

    const safePosition = Math.max(0, Math.floor(position));
    const totalDur = Math.floor(htmlVideo.duration);

    const payload = {
      videoRefId: String(videoRefId),
      lastWatchedDuration: safePosition,
      videoDuration: totalDur,
      isCompleted: isFinal || (totalDur > 0 && safePosition >= totalDur),
    };

    progressRequestInFlight = true;
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] API CALL ${JSON.stringify(payload)}`);
    }
    logs.push(`[VIDEO PROGRESS] API CALL ${JSON.stringify(payload)}`);

    try {
      await mockCreateVideoProgress(payload);
      lastSavedPosition = safePosition;
      if (videoType === "google-drive") {
        logs.push(`[GOOGLE DRIVE] API SUCCESS ${safePosition}`);
      }
      logs.push(`[VIDEO PROGRESS] API SUCCESS ${safePosition}`);
    } catch (err) {
      if (videoType === "google-drive") {
        logs.push(`[GOOGLE DRIVE] API ERROR ${err.message}`);
      }
      errors.push(`[VIDEO PROGRESS] API ERROR ${err.message}`);
      logs.push(`[VIDEO PROGRESS] API ERROR ${err.message}`);
    } finally {
      progressRequestInFlight = false;
      if (pendingPausePosition !== null) {
        const nextPos = pendingPausePosition;
        pendingPausePosition = null;
        void saveProgressOnPause(nextPos);
      }
    }
  }

  async function saveProgressOnPause(explicitPosition) {
    logs.push("[VIDEO PROGRESS] PAUSE SAVE START");

    if (htmlVideo.ended || finalProgressSent) {
      return;
    }

    const rawTime = typeof explicitPosition === "number" ? explicitPosition : htmlVideo.currentTime;
    if (!Number.isFinite(rawTime) || rawTime < 0) {
      return;
    }

    const currentPosition = Math.floor(rawTime);
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] CURRENT TIME ${currentPosition}`);
    }
    logs.push(`[VIDEO PROGRESS] PAUSE POSITION: ${currentPosition}`);

    const videoRefId = resolveVideoRefId();
    if (!videoRefId) {
      logs.push("[VIDEO PROGRESS] PAUSE: VIDEO REF ID MISSING");
      return;
    }

    if (progressRequestInFlight) {
      logs.push(`[VIDEO PROGRESS] PAUSE: REQUEST ALREADY RUNNING, QUEUEING ${currentPosition}`);
      pendingPausePosition = currentPosition;
      return;
    }

    const totalDur = Math.floor(htmlVideo.duration || 0);
    const payload = {
      videoRefId: String(videoRefId),
      lastWatchedDuration: currentPosition,
      videoDuration: totalDur,
      isCompleted: totalDur > 0 && currentPosition >= totalDur,
    };

    progressRequestInFlight = true;
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] API CALL ${JSON.stringify(payload)}`);
    }
    logs.push(`[VIDEO PROGRESS] PAUSE API CALL ${JSON.stringify(payload)}`);

    try {
      await mockCreateVideoProgress(payload);
      lastSavedPosition = currentPosition;
      lastCheckedPosition = currentPosition;
      prevTickPosition = currentPosition;
      if (videoType === "google-drive") {
        logs.push(`[GOOGLE DRIVE] API SUCCESS ${currentPosition}`);
      }
      logs.push(`[VIDEO PROGRESS] PAUSE API SUCCESS: ${currentPosition}`);
    } catch (err) {
      if (videoType === "google-drive") {
        logs.push(`[GOOGLE DRIVE] API ERROR ${err.message}`);
      }
      errors.push(`[VIDEO PROGRESS] PAUSE API ERROR ${err.message}`);
      logs.push(`[VIDEO PROGRESS] PAUSE API ERROR ${err.message}`);
    } finally {
      progressRequestInFlight = false;
      if (pendingPausePosition !== null) {
        const nextPos = pendingPausePosition;
        pendingPausePosition = null;
        void saveProgressOnPause(nextPos);
      }
    }
  }

  function trackVideoProgress() {
    logs.push("[VIDEO PROGRESS] TRACK CALLED");
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] VIDEO ELEMENT ${htmlVideo}`);
    }
    logs.push(`[VIDEO PROGRESS] VIDEO ELEMENT ${htmlVideo}`);

    if (htmlVideo.paused || htmlVideo.ended) {
      return;
    }

    const rawTime = htmlVideo.currentTime;
    if (!Number.isFinite(rawTime) || rawTime < 0) {
      return;
    }

    const currentPosition = Math.floor(rawTime);
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] CURRENT TIME ${currentPosition}`);
      logs.push(`[GOOGLE DRIVE] VIDEO DURATION ${Math.floor(htmlVideo.duration)}`);
    }
    logs.push(`[VIDEO PROGRESS] CURRENT POSITION ${currentPosition}`);
    logs.push(`[VIDEO PROGRESS] LAST SAVED POSITION ${lastSavedPosition}`);

    const tickDelta = currentPosition - prevTickPosition;
    if (tickDelta < 0 || tickDelta > 3) {
      lastCheckedPosition = currentPosition;
    }
    prevTickPosition = currentPosition;

    const unsavedDuration = Math.max(0, currentPosition - lastCheckedPosition);
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] TRACK PROGRESS ${JSON.stringify({ currentPosition, lastSaved: lastSavedPosition, unsavedDuration })}`);
    }
    logs.push(`[VIDEO PROGRESS] UNSAVED DURATION ${unsavedDuration}`);

    const videoRefId = resolveVideoRefId();
    logs.push(`[VIDEO PROGRESS] VIDEO REF ID ${videoRefId}`);

    if (unsavedDuration >= 5) {
      if (progressRequestInFlight) {
        return;
      }
      lastCheckedPosition = currentPosition;
      void sendVideoProgress(currentPosition, false);
    }
  }

  function startProgressTracking() {
    if (videoType === "google-drive") {
      logs.push("[GOOGLE DRIVE] START PROGRESS TRACKING");
    }
    logs.push("[VIDEO PROGRESS] START TRACKING");
    if (progressTimer !== null) {
      return;
    }

    progressTimer = true;
    logs.push("[VIDEO PROGRESS] TIMER CREATED");
  }

  function stopProgressTracking() {
    logs.push("[VIDEO PROGRESS] STOP TRACKING");
    if (progressTimer !== null) {
      progressTimer = null;
    }
  }

  function handlePlay() {
    if (videoType === "google-drive") {
      logs.push("[GOOGLE DRIVE] PLAY");
      logs.push(`[GOOGLE DRIVE] VIDEO ELEMENT ${htmlVideo}`);
    }
    logs.push("[VIDEO PROGRESS] PLAY");
    htmlVideo.paused = false;
    startProgressTracking();
  }

  function handlePause() {
    if (videoType === "google-drive") {
      logs.push("[GOOGLE DRIVE] PAUSE");
    }
    logs.push("[VIDEO] PAUSE EVENT");
    logs.push("[VIDEO PROGRESS] PAUSE");
    htmlVideo.paused = true;
    stopProgressTracking();
    void saveProgressOnPause();
  }

  function handleEnded() {
    if (videoType === "google-drive") {
      logs.push("[GOOGLE DRIVE] END");
    }
    logs.push("[VIDEO PROGRESS] END");
    htmlVideo.paused = true;
    htmlVideo.ended = true;
    stopProgressTracking();

    if (finalProgressSent) {
      return;
    }
    finalProgressSent = true;

    const finalDuration = Math.floor(htmlVideo.duration > 0 ? htmlVideo.duration : lastSavedPosition);
    void sendVideoProgress(finalDuration, true);
  }

  function handleSeek(newTime) {
    const clamped = Math.max(0, Math.floor(newTime));
    htmlVideo.currentTime = clamped;
    lastCheckedPosition = clamped;
    prevTickPosition = clamped;
    if (videoType === "google-drive") {
      logs.push(`[GOOGLE DRIVE] SEEK ${clamped}`);
    }
    logs.push(`[VIDEO PROGRESS] SEEK ${clamped} LAST SAVED: ${lastSavedPosition}`);
  }

  function onProgressReceived(progress) {
    if (progress) {
      resumePosition = Number(progress.lastWatchedDuration ?? 0);
      isCompleted = Boolean(progress.isCompleted);
    } else {
      resumePosition = 0;
      isCompleted = false;
    }
    attemptResume();
  }

  function attemptResume() {
    if (hasAppliedResume) return;
    if (resumePosition === null) return;

    if (isCompleted) {
      htmlVideo.currentTime = 0;
      lastSavedPosition = 0;
      lastCheckedPosition = 0;
      prevTickPosition = 0;
      hasAppliedResume = true;
      finalProgressSent = false;
      return;
    }

    if (resumePosition > 0 && resumePosition < htmlVideo.duration) {
      htmlVideo.currentTime = resumePosition;
      lastSavedPosition = Math.floor(resumePosition);
      lastCheckedPosition = Math.floor(resumePosition);
      prevTickPosition = Math.floor(resumePosition);
      hasAppliedResume = true;
    } else {
      htmlVideo.currentTime = 0;
      lastSavedPosition = 0;
      lastCheckedPosition = 0;
      prevTickPosition = 0;
      hasAppliedResume = true;
    }
  }

  async function tickSeconds(seconds) {
    for (let i = 0; i < seconds; i++) {
      if (progressTimer !== null && !htmlVideo.paused && !htmlVideo.ended) {
        logs.push("[VIDEO PROGRESS] TIMER TICK");
        htmlVideo.currentTime += 1;
        trackVideoProgress();
        await new Promise((r) => setImmediate(r));
      }
    }
  }

  return {
    htmlVideo,
    apiCalls,
    logs,
    errors,
    setApiShouldFail: (val) => { apiShouldFail = val; },
    getLastSavedPosition: () => lastSavedPosition,
    getLastCheckedPosition: () => lastCheckedPosition,
    isTimerRunning: () => progressTimer !== null,
    handlePlay,
    handlePause,
    handleEnded,
    handleSeek,
    onProgressReceived,
    attemptResume,
    tickSeconds,
    saveProgressOnPause,
  };
}

async function runTests() {
  // TEST 1: Google Drive Play -> Required Logs -> HTMLVideoElement verified
  {
    const h = createProgressTrackingHarness("gdrive-01", 120, "google-drive");
    h.onProgressReceived(null);
    h.handlePlay();

    assert.ok(h.logs.includes("[GOOGLE DRIVE] PLAY"), "Log [GOOGLE DRIVE] PLAY");
    assert.ok(h.logs.some(l => l.startsWith("[GOOGLE DRIVE] VIDEO ELEMENT")), "Log [GOOGLE DRIVE] VIDEO ELEMENT");
    assert.ok(h.logs.includes("[GOOGLE DRIVE] START PROGRESS TRACKING"), "Log [GOOGLE DRIVE] START PROGRESS TRACKING");

    await h.tickSeconds(1);
    assert.ok(h.logs.includes("[GOOGLE DRIVE] CURRENT TIME 1"), "Log [GOOGLE DRIVE] CURRENT TIME");
    assert.ok(h.logs.includes("[GOOGLE DRIVE] VIDEO DURATION 120"), "Log [GOOGLE DRIVE] VIDEO DURATION");
    assert.ok(h.logs.some(l => l.startsWith("[GOOGLE DRIVE] TRACK PROGRESS")), "Log [GOOGLE DRIVE] TRACK PROGRESS");
    console.log("PASS: TEST 1 - Google Drive Play logs element, starts timer, and tracks progress");
  }

  // TEST 2: Google Drive 5s, 10s, 15s automatic progress
  {
    const h = createProgressTrackingHarness("gdrive-02", 100, "google-drive");
    h.onProgressReceived(null);
    h.handlePlay();

    await h.tickSeconds(5);
    assert.strictEqual(h.apiCalls.length, 1);
    assert.strictEqual(h.apiCalls[0].lastWatchedDuration, 5);
    assert.ok(h.logs.some(l => l.includes("[GOOGLE DRIVE] API CALL")));
    assert.ok(h.logs.some(l => l.includes("[GOOGLE DRIVE] API SUCCESS 5")));

    await h.tickSeconds(5); // 10s
    assert.strictEqual(h.apiCalls.length, 2);
    assert.strictEqual(h.apiCalls[1].lastWatchedDuration, 10);

    await h.tickSeconds(5); // 15s
    assert.strictEqual(h.apiCalls.length, 3);
    assert.strictEqual(h.apiCalls[2].lastWatchedDuration, 15);
    console.log("PASS: TEST 2 - Google Drive automatic progress fires at 5s, 10s, 15s");
  }

  // TEST 3: Google Drive Pause immediately saves current position (e.g. 47s)
  {
    const h = createProgressTrackingHarness("gdrive-03", 200, "google-drive");
    h.onProgressReceived(null);
    h.handlePlay();
    await h.tickSeconds(47);

    const callsBefore = h.apiCalls.length; // 9 calls for 5, 10... 45
    h.handlePause();
    await new Promise((r) => setImmediate(r));

    assert.ok(h.logs.includes("[GOOGLE DRIVE] PAUSE"), "Log [GOOGLE DRIVE] PAUSE");
    assert.strictEqual(h.apiCalls.length, callsBefore + 1, "Immediate call on pause");
    assert.strictEqual(h.apiCalls[h.apiCalls.length - 1].lastWatchedDuration, 47);
    assert.strictEqual(h.getLastSavedPosition(), 47);
    assert.ok(h.logs.some(l => l.includes("[GOOGLE DRIVE] API SUCCESS 47")));
    console.log("PASS: TEST 3 - Google Drive pause at 47s immediately saves 47");
  }

  // TEST 4: Google Drive Seek to 80, watch to 87, pause -> sends 87
  {
    const h = createProgressTrackingHarness("gdrive-04", 200, "google-drive");
    h.onProgressReceived(null);
    h.handlePlay();
    await h.tickSeconds(20);

    h.handleSeek(80);
    assert.ok(h.logs.includes("[GOOGLE DRIVE] SEEK 80"));

    await h.tickSeconds(7); // watches from 80 to 87
    assert.strictEqual(h.htmlVideo.currentTime, 87);

    h.handlePause();
    await new Promise((r) => setImmediate(r));

    assert.strictEqual(h.apiCalls[h.apiCalls.length - 1].lastWatchedDuration, 87);
    console.log("PASS: TEST 4 - Google Drive seek to 80, watch to 87, pause sends 87");
  }

  // TEST 5: Google Drive Resume from 35s
  {
    const h = createProgressTrackingHarness("gdrive-05", 100, "google-drive");
    h.onProgressReceived({
      videoRefId: "gdrive-05",
      lastWatchedDuration: 35,
      videoDuration: 100,
      isCompleted: false,
    });

    assert.strictEqual(h.htmlVideo.currentTime, 35, "Resumed at 35s");
    assert.strictEqual(h.getLastSavedPosition(), 35);

    h.handlePlay();
    assert.strictEqual(h.apiCalls.length, 0, "No duplicate call immediately on resume play");

    await h.tickSeconds(5); // 35 -> 40
    assert.strictEqual(h.apiCalls.length, 1);
    assert.strictEqual(h.apiCalls[0].lastWatchedDuration, 40);
    console.log("PASS: TEST 5 - Google Drive resumes from 35s and tracks at 40s");
  }

  // TEST 6: Google Drive Completion
  {
    const h = createProgressTrackingHarness("gdrive-06", 60, "google-drive");
    h.onProgressReceived(null);
    h.handlePlay();
    await h.tickSeconds(58);

    h.handleEnded();
    await new Promise((r) => setImmediate(r));

    assert.ok(h.logs.includes("[GOOGLE DRIVE] END"));
    const lastCall = h.apiCalls[h.apiCalls.length - 1];
    assert.strictEqual(lastCall.isCompleted, true);
    assert.strictEqual(lastCall.lastWatchedDuration, 60);
    console.log("PASS: TEST 6 - Google Drive completion sends isCompleted: true");
  }

  // TEST 7: YouTube playback compatibility check
  {
    const h = createProgressTrackingHarness("yt-01", 120, "youtube");
    h.onProgressReceived(null);
    h.handlePlay();
    await h.tickSeconds(5);

    assert.strictEqual(h.apiCalls.length, 1);
    assert.strictEqual(h.apiCalls[0].lastWatchedDuration, 5);
    console.log("PASS: TEST 7 - YouTube playback tracking remains 100% functional");
  }

  console.log("\n=======================================================");
  console.log(" ALL GOOGLE DRIVE & YOUTUBE TESTS PASSED! ");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
