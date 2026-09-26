// scratch/test_resume_playback.cjs
const assert = require('assert');

console.log("=== RUNNING RESUME PLAYBACK LOGIC VERIFICATION ===");

// Simulation harness for VideoPlayer resume logic
function createVideoPlayerHarness(userRole = 'user') {
  const logs = [];
  const warns = [];
  const origLog = console.log;
  const origWarn = console.warn;

  console.log = (...args) => {
    logs.push(args.join(' '));
    origLog(...args);
  };
  console.warn = (...args) => {
    warns.push(args.join(' '));
    origWarn(...args);
  };

  const user = { role: userRole };
  const htmlVideo = {
    currentTime: 0,
    duration: NaN,
    readyState: 0,
    paused: true,
    ended: false,
  };

  const resumePositionRef = { current: null };
  const hasAppliedResumeRef = { current: false };
  const isCompletedRef = { current: false };
  const latestCurrentTimeRef = { current: 0 };
  const latestDurationRef = { current: 0 };
  const isPlayingRef = { current: false };
  const isNativeVideo = true;

  const savedApiPayloads = [];

  function attemptResume() {
    if (hasAppliedResumeRef.current) return;
    if (user?.role !== 'user') return;
    if (resumePositionRef.current === null) return;

    const savedDuration = resumePositionRef.current;
    const isCompleted = isCompletedRef.current;

    if (isNativeVideo) {
      const video = htmlVideo;
      if (!video) return;

      if (video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      if (isCompleted) {
        video.currentTime = 0;
        latestCurrentTimeRef.current = 0;
        hasAppliedResumeRef.current = true;
        return;
      }

      if (savedDuration > 0) {
        console.log("[VIDEO RESUME] Saved position:", savedDuration);
        console.log("[VIDEO RESUME] Video duration:", video.duration);

        if (savedDuration < video.duration) {
          console.log("[VIDEO RESUME] Applying position:", savedDuration);
          try {
            video.currentTime = savedDuration;
            latestCurrentTimeRef.current = savedDuration;
            hasAppliedResumeRef.current = true;
            console.log("[VIDEO RESUME] Resume applied successfully");
          } catch {
            console.warn("[VIDEO RESUME] Unable to apply saved position");
            hasAppliedResumeRef.current = true;
          }
        } else {
          console.warn("[VIDEO RESUME] Unable to apply saved position");
          video.currentTime = 0;
          latestCurrentTimeRef.current = 0;
          hasAppliedResumeRef.current = true;
        }
      } else {
        video.currentTime = 0;
        latestCurrentTimeRef.current = 0;
        hasAppliedResumeRef.current = true;
      }
    }
  }

  function onMetadataLoaded(duration) {
    htmlVideo.duration = duration;
    htmlVideo.readyState = 1;
    latestDurationRef.current = duration;
    attemptResume();
  }

  function onProgressReceived(progress) {
    if (progress) {
      resumePositionRef.current = Number(progress.lastWatchedDuration ?? 0);
      isCompletedRef.current = Boolean(progress.isCompleted);
    } else {
      resumePositionRef.current = 0;
      isCompletedRef.current = false;
    }
    attemptResume();
  }

  function onVideoChange(newVideoRefId) {
    hasAppliedResumeRef.current = false;
    resumePositionRef.current = null;
    isCompletedRef.current = false;
    latestCurrentTimeRef.current = 0;
    latestDurationRef.current = 0;
    htmlVideo.currentTime = 0;
    htmlVideo.duration = NaN;
    htmlVideo.readyState = 0;
    htmlVideo.paused = true;
    isPlayingRef.current = false;
  }

  function simulate15sProgressTick(currentVideoRefId) {
    if (!isPlayingRef.current) return;
    const curTime = htmlVideo.currentTime;
    const totalDur = htmlVideo.duration;

    const payload = {
      videoRefId: currentVideoRefId,
      lastWatchedDuration: Math.floor(curTime),
      videoDuration: Math.floor(totalDur),
      isCompleted: false,
    };
    savedApiPayloads.push(payload);
  }

  function cleanup() {
    console.log = origLog;
    console.warn = origWarn;
  }

  return {
    htmlVideo,
    resumePositionRef,
    hasAppliedResumeRef,
    isCompletedRef,
    latestCurrentTimeRef,
    isPlayingRef,
    savedApiPayloads,
    logs,
    warns,
    attemptResume,
    onMetadataLoaded,
    onProgressReceived,
    onVideoChange,
    simulate15sProgressTick,
    cleanup,
  };
}

// TEST 1: Progress data arrives first, then video metadata (Case 1)
{
  const h = createVideoPlayerHarness();
  h.onProgressReceived({
    videoRefId: "test-ref-1",
    lastWatchedDuration: 120,
    videoDuration: 168,
    isCompleted: false,
  });

  assert.strictEqual(h.resumePositionRef.current, 120);
  assert.strictEqual(h.hasAppliedResumeRef.current, false, "Should not apply before metadata");
  assert.strictEqual(h.htmlVideo.currentTime, 0);

  // Metadata loads
  h.onMetadataLoaded(168);
  assert.strictEqual(h.hasAppliedResumeRef.current, true, "Should apply once metadata loads");
  assert.strictEqual(h.htmlVideo.currentTime, 120, "currentTime should be 120");
  assert.ok(h.logs.some(l => l.includes("[VIDEO RESUME] Resume applied successfully")));
  h.cleanup();
  console.log("PASS: Test 1 (Case 1: Progress first, then metadata)");
}

// TEST 2: Video metadata loads first, then progress arrives (Case 2)
{
  const h = createVideoPlayerHarness();
  h.onMetadataLoaded(168);
  assert.strictEqual(h.hasAppliedResumeRef.current, false, "Should not apply before progress arrives");
  assert.strictEqual(h.htmlVideo.currentTime, 0);

  // Progress arrives
  h.onProgressReceived({
    videoRefId: "test-ref-2",
    lastWatchedDuration: 120,
    videoDuration: 168,
    isCompleted: false,
  });

  assert.strictEqual(h.hasAppliedResumeRef.current, true, "Should apply once progress arrives");
  assert.strictEqual(h.htmlVideo.currentTime, 120, "currentTime should be 120");
  assert.ok(h.logs.some(l => l.includes("[VIDEO RESUME] Applying position: 120")));
  h.cleanup();
  console.log("PASS: Test 2 (Case 2: Metadata first, then progress)");
}

// TEST 3: Resume position applied ONLY ONCE per video
{
  const h = createVideoPlayerHarness();
  h.onProgressReceived({ lastWatchedDuration: 120, isCompleted: false });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 120);

  // User plays and advances to 130
  h.htmlVideo.currentTime = 130;

  // Metadata or canPlay triggers again
  h.attemptResume();
  assert.strictEqual(h.htmlVideo.currentTime, 130, "Should NOT overwrite currentTime once applied");
  h.cleanup();
  console.log("PASS: Test 3 (Do not apply resume multiple times)");
}

// TEST 4: Video changes from Video A to Video B
{
  const h = createVideoPlayerHarness();
  // Video A
  h.onProgressReceived({ lastWatchedDuration: 120, isCompleted: false });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 120);

  // Switch to Video B
  h.onVideoChange("video-b");
  assert.strictEqual(h.hasAppliedResumeRef.current, false);
  assert.strictEqual(h.resumePositionRef.current, null);

  // Video B progress arrives
  h.onProgressReceived({ lastWatchedDuration: 45, isCompleted: false });
  h.onMetadataLoaded(200);
  assert.strictEqual(h.htmlVideo.currentTime, 45, "Video B should resume from 45, not 120");
  h.cleanup();
  console.log("PASS: Test 4 (Switching Video A -> Video B resets and uses Video B duration)");
}

// TEST 5: New video (lastWatchedDuration = 0)
{
  const h = createVideoPlayerHarness();
  h.onProgressReceived({ lastWatchedDuration: 0, isCompleted: false });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 0);
  assert.strictEqual(h.hasAppliedResumeRef.current, true);
  assert.strictEqual(h.warns.length, 0, "New video should not trigger warning");
  h.cleanup();
  console.log("PASS: Test 5 (New video starts at 0 without warnings)");
}

// TEST 6: Completed video (isCompleted = true)
{
  const h = createVideoPlayerHarness();
  h.onProgressReceived({ lastWatchedDuration: 168, isCompleted: true });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 0, "Completed video should not resume from old position");
  assert.strictEqual(h.hasAppliedResumeRef.current, true);
  h.cleanup();
  console.log("PASS: Test 6 (Completed video starts at 0 and does not resume from end)");
}

// TEST 7: Seek validation (savedPosition >= video.duration)
{
  const h = createVideoPlayerHarness();
  h.onProgressReceived({ lastWatchedDuration: 200, isCompleted: false });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 0, "Invalid position should fallback to 0");
  assert.ok(h.warns.some(w => w.includes("[VIDEO RESUME] Unable to apply saved position")));
  h.cleanup();
  console.log("PASS: Test 7 (Seek validation prevents out-of-bounds currentTime)");
}

// TEST 8: 15-second progress tracking after resume
{
  const h = createVideoPlayerHarness();
  // Open video with saved duration 60
  h.onProgressReceived({ lastWatchedDuration: 60, isCompleted: false });
  h.onMetadataLoaded(168);
  assert.strictEqual(h.htmlVideo.currentTime, 60);

  // User presses Play
  h.isPlayingRef.current = true;

  // After 15 seconds: currentTime ≈ 75
  h.htmlVideo.currentTime = 75;
  h.simulate15sProgressTick("test-ref-8");

  // After another 15 seconds: currentTime ≈ 90
  h.htmlVideo.currentTime = 90;
  h.simulate15sProgressTick("test-ref-8");

  assert.strictEqual(h.savedApiPayloads.length, 2);
  assert.deepStrictEqual(h.savedApiPayloads[0], {
    videoRefId: "test-ref-8",
    lastWatchedDuration: 75,
    videoDuration: 168,
    isCompleted: false,
  });
  assert.deepStrictEqual(h.savedApiPayloads[1], {
    videoRefId: "test-ref-8",
    lastWatchedDuration: 90,
    videoDuration: 168,
    isCompleted: false,
  });
  h.cleanup();
  console.log("PASS: Test 8 (15-second tracking accurately uses playback currentTime, not saved duration)");
}

console.log("=== ALL RESUME PLAYBACK TESTS PASSED SUCCESSFULLY! ===");
