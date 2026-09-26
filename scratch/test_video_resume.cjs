// scratch/test_video_resume.cjs
const assert = require('assert');

console.log("=== RUNNING VIDEO RESUME PLAYBACK TEST SUITE ===");

function createResumeTestHarness() {
  const logs = [];
  const resumeAppliedRef = { current: false };
  const resumePositionRef = { current: null };
  const isCompletedRef = { current: false };

  const htmlVideo = {
    currentTime: 0,
    duration: 0,
    readyState: 0,
  };

  let currentSourceType = 'direct';

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

    // HTML5 Video (Direct / HLS / DASH / Google Drive using HTML5 video)
    const video = htmlVideo;
    if (!video) {
      logs.push("[VIDEO RESUME] VIDEO NOT READY");
      return;
    }

    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.readyState < 1) {
      logs.push("[VIDEO RESUME] VIDEO NOT READY");
      return;
    }

    const totalDur = video.duration;
    if (isCompletedRef.current || (totalDur > 0 && savedPosition >= totalDur)) {
      video.currentTime = 0;
      resumeAppliedRef.current = true;
      return;
    }

    const safePosition = Math.min(
      savedPosition,
      Math.max(0, totalDur - 0.5)
    );

    console.log(`[VIDEO RESUME] APPLYING POSITION: ${safePosition}`);
    logs.push(`[VIDEO RESUME] APPLYING POSITION: ${safePosition}`);
    video.currentTime = safePosition;
    console.log(`[VIDEO RESUME] RESUMED FROM: ${safePosition}`);
    logs.push(`[VIDEO RESUME] RESUMED FROM: ${safePosition}`);
    resumeAppliedRef.current = true;
  }

  function handleLoadedMetadata(dur) {
    htmlVideo.duration = dur;
    htmlVideo.readyState = 1;
    logs.push("[VIDEO RESUME] VIDEO METADATA READY");
    logs.push(`[VIDEO RESUME] VIDEO DURATION ${dur}`);
    applyResumePosition();
  }

  function handleProgressResponse(progress) {
    logs.push("[VIDEO RESUME] PROGRESS RESPONSE");
    if (progress) {
      const raw = progress.lastWatchedDuration ?? progress.last_watched_duration;
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        resumePositionRef.current = parsed;
        logs.push(`[VIDEO RESUME] SAVED POSITION: ${parsed}`);
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

  function switchVideo() {
    resumeAppliedRef.current = false;
    resumePositionRef.current = null;
    isCompletedRef.current = false;
    htmlVideo.currentTime = 0;
    htmlVideo.duration = 0;
    htmlVideo.readyState = 0;
  }

  return {
    logs,
    resumeAppliedRef,
    resumePositionRef,
    htmlVideo,
    applyResumePosition,
    handleLoadedMetadata,
    handleProgressResponse,
    switchVideo,
  };
}

// TEST 1: Case A - Progress arrives first, metadata arrives later
{
  const h = createResumeTestHarness();
  // 1. Progress arrives
  h.handleProgressResponse({ lastWatchedDuration: 125, videoDuration: 300, isCompleted: false });
  assert.strictEqual(h.resumeAppliedRef.current, false, "Should not be applied before metadata is ready");
  assert.strictEqual(h.htmlVideo.currentTime, 0);

  // 2. Metadata arrives later
  h.handleLoadedMetadata(300);
  assert.strictEqual(h.resumeAppliedRef.current, true, "Should be applied once metadata is ready");
  assert.strictEqual(h.htmlVideo.currentTime, 125, "currentTime must be 125");
  assert.ok(h.logs.includes("[VIDEO RESUME] APPLYING POSITION: 125"));
  assert.ok(h.logs.includes("[VIDEO RESUME] RESUMED FROM: 125"));
  console.log("PASS: TEST 1 - Case A (Progress first, metadata later) successfully resumes at 125");
}

// TEST 2: Case B - Metadata arrives first, progress arrives later
{
  const h = createResumeTestHarness();
  // 1. Metadata arrives
  h.handleLoadedMetadata(300);
  assert.strictEqual(h.resumeAppliedRef.current, false, "Should not be applied before progress arrives");
  assert.strictEqual(h.htmlVideo.currentTime, 0);

  // 2. Progress arrives later
  h.handleProgressResponse({ lastWatchedDuration: 60, videoDuration: 300, isCompleted: false });
  assert.strictEqual(h.resumeAppliedRef.current, true, "Should be applied once progress arrives");
  assert.strictEqual(h.htmlVideo.currentTime, 60, "currentTime must be 60");
  assert.ok(h.logs.includes("[VIDEO RESUME] APPLYING POSITION: 60"));
  assert.ok(h.logs.includes("[VIDEO RESUME] RESUMED FROM: 60"));
  console.log("PASS: TEST 2 - Case B (Metadata first, progress later) successfully resumes at 60");
}

// TEST 3: No saved progress or 0 seconds
{
  const h = createResumeTestHarness();
  h.handleLoadedMetadata(300);
  h.handleProgressResponse(null);
  assert.strictEqual(h.htmlVideo.currentTime, 0, "Video must stay at 0");
  assert.ok(h.logs.includes("[VIDEO RESUME] NO SAVED POSITION"));
  console.log("PASS: TEST 3 - No saved progress leaves video at 0");
}

// TEST 4: Prevent repeated resume
{
  const h = createResumeTestHarness();
  h.handleLoadedMetadata(300);
  h.handleProgressResponse({ lastWatchedDuration: 50, videoDuration: 300, isCompleted: false });
  assert.strictEqual(h.htmlVideo.currentTime, 50);

  // Simulate extra metadata or render calls
  h.applyResumePosition();
  assert.ok(h.logs.includes("[VIDEO RESUME] ALREADY APPLIED"));
  console.log("PASS: TEST 4 - Prevent repeated resume works");
}

// TEST 5: Video Switching (Video A: 120 -> Video B: 300)
{
  const h = createResumeTestHarness();
  // Video A
  h.handleLoadedMetadata(200);
  h.handleProgressResponse({ lastWatchedDuration: 120, videoDuration: 200, isCompleted: false });
  assert.strictEqual(h.htmlVideo.currentTime, 120);

  // Switch to Video B
  h.switchVideo();
  assert.strictEqual(h.resumeAppliedRef.current, false);

  // Video B loads
  h.handleLoadedMetadata(500);
  h.handleProgressResponse({ lastWatchedDuration: 300, videoDuration: 500, isCompleted: false });
  assert.strictEqual(h.htmlVideo.currentTime, 300, "Video B must resume at 300");
  console.log("PASS: TEST 5 - Video switching correctly resets and resumes Video B at 300");
}

// TEST 6: Do not seek beyond video duration (savedPosition = 500, duration = 450)
{
  const h = createResumeTestHarness();
  h.handleLoadedMetadata(450);
  h.handleProgressResponse({ lastWatchedDuration: 500, videoDuration: 450, isCompleted: false });
  // Should treat as completed / start at 0
  assert.strictEqual(h.htmlVideo.currentTime, 0);
  console.log("PASS: TEST 6 - Seeking beyond video duration is handled safely");
}

console.log("\n=======================================================");
console.log(" ALL VIDEO RESUME PLAYBACK TESTS PASSED! ");
console.log("=======================================================\n");
