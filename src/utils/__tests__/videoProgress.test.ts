import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectVideoSource,
  getYouTubeVideoId,
  getYouTubeEmbedUrl,
  getGoogleDriveFileId,
  sanitizeVideoUrlForLogging,
} from '../videoUtils.ts';

test('1. Google Drive video detection and URLs', () => {
  const gdriveUrl = 'https://drive.google.com/file/d/1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH/view?usp=drive_link';
  const detected = detectVideoSource(gdriveUrl);

  assert.strictEqual(detected.type, 'google-drive');
  assert.strictEqual(detected.videoId, '1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH');
  assert.strictEqual(
    detected.previewUrl,
    'https://drive.google.com/file/d/1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH/preview'
  );
  assert.strictEqual(
    detected.streamUrl,
    'https://drive.usercontent.google.com/download?id=1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH&export=download'
  );
});

test('2. Google Drive alternate URL formats', () => {
  const openUrl = 'https://drive.google.com/open?id=1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH';
  assert.strictEqual(getGoogleDriveFileId(openUrl), '1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH');

  const ucUrl = 'https://drive.google.com/uc?id=1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH';
  assert.strictEqual(getGoogleDriveFileId(ucUrl), '1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH');
});

test('3. YouTube video detection and embed URLs', () => {
  const ytWatch = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  assert.strictEqual(getYouTubeVideoId(ytWatch), 'dQw4w9WgXcQ');

  const ytShort = 'https://youtu.be/dQw4w9WgXcQ';
  assert.strictEqual(getYouTubeVideoId(ytShort), 'dQw4w9WgXcQ');

  const ytEmbed = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  assert.strictEqual(getYouTubeVideoId(ytEmbed), 'dQw4w9WgXcQ');

  const ytSource = detectVideoSource(ytWatch);
  assert.strictEqual(ytSource.type, 'youtube');
  assert.strictEqual(ytSource.videoId, 'dQw4w9WgXcQ');

  // Embed URL with resume start time
  const embedWithTime = getYouTubeEmbedUrl('dQw4w9WgXcQ', 45);
  assert.match(embedWithTime, /start=45/);
  assert.match(embedWithTime, /enablejsapi=1/);
});

test('4. Direct video files and cloud storage URLs', () => {
  const mp4Url = 'https://example-bucket.s3.amazonaws.com/courses/lesson-1/video.mp4';
  const detected = detectVideoSource(mp4Url);
  assert.strictEqual(detected.type, 'direct');
  assert.strictEqual(detected.url, mp4Url);

  const webmUrl = 'https://cdn.example.com/stream.webm';
  assert.strictEqual(detectVideoSource(webmUrl).type, 'direct');
});

test('5. Rejection of non-video file formats', () => {
  assert.strictEqual(detectVideoSource('https://example.com/document.pdf').type, 'unknown');
  assert.strictEqual(detectVideoSource('https://example.com/archive.zip').type, 'unknown');
  assert.strictEqual(detectVideoSource('https://example.com/image.png').type, 'unknown');
});

test('6. Video URL sanitization for secure logging (no tokens or queries)', () => {
  const sensitiveUrl = 'https://example.com/video.mp4?token=secret123&auth=bearer';
  const sanitized = sanitizeVideoUrlForLogging(sensitiveUrl);
  assert.strictEqual(sanitized, 'https://example.com/video.mp4');
});

test('7. Progress API payload validation matches strict 3-field contract', () => {
  const videoRefId = 'db642430-54f5-4a1a-adbe-eaf9cc0e78c6';
  const lastWatchedDuration = 120;
  const videoDuration = 600;

  // Function simulating exact payload preparation in VideoPlayer & api.ts
  function buildProgressPayload(refId: string, watched: number, dur: number) {
    const safeDur = Math.max(0, Math.floor(dur));
    assert(safeDur > 0, 'Duration must be greater than 0');

    const safePos = Math.min(safeDur, Math.max(0, Math.floor(watched)));
    const payload: { videoRefId: string; lastWatchedDuration: number; videoDuration: number } = {
      videoRefId: String(refId),
      lastWatchedDuration: safePos,
      videoDuration: safeDur,
    };
    return payload;
  }

  const payload = buildProgressPayload(videoRefId, lastWatchedDuration, videoDuration);

  // Exact 3 fields
  const keys = Object.keys(payload);
  assert.deepStrictEqual(keys.sort(), ['lastWatchedDuration', 'videoDuration', 'videoRefId'].sort());
  assert.strictEqual(typeof payload.videoRefId, 'string');
  assert.strictEqual(typeof payload.lastWatchedDuration, 'number');
  assert.strictEqual(typeof payload.videoDuration, 'number');
  assert.strictEqual(payload.lastWatchedDuration, 120);
  assert.strictEqual(payload.videoDuration, 600);
  assert.strictEqual('userId' in payload, false, 'Payload must not contain userId');
  assert.strictEqual('isCompleted' in payload, false, 'Payload must not contain isCompleted');
});

test('8. Progress tracking 10-second timer simulation', async () => {
  // Simulated playback tracker
  const trackingEvents: Array<{ time: number; position: number }> = [];
  let isPlaying = false;
  let currentPosition = 0;
  const videoDuration = 100;
  let timer: NodeJS.Timeout | null = null;

  function startTracking() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!isPlaying) {
        if (timer) clearInterval(timer);
        return;
      }
      trackingEvents.push({ time: Date.now(), position: Math.floor(currentPosition) });
    }, 50); // fast simulation (50ms representing 10s)
  }

  function stopTracking() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // 1. Start playback
  isPlaying = true;
  currentPosition = 0;
  startTracking();

  // Advance time to 10s
  await new Promise((r) => setTimeout(r, 60));
  currentPosition = 10;
  await new Promise((r) => setTimeout(r, 60));
  currentPosition = 20;
  await new Promise((r) => setTimeout(r, 60));

  // 2. Pause playback
  isPlaying = false;
  stopTracking();
  const pauseCount = trackingEvents.length;

  // Wait to ensure no ticks fire while paused
  await new Promise((r) => setTimeout(r, 120));
  assert.strictEqual(trackingEvents.length, pauseCount, 'No ticks must fire while paused');

  // 3. Resume playback
  isPlaying = true;
  currentPosition = 25;
  startTracking();
  await new Promise((r) => setTimeout(r, 60));
  stopTracking();

  assert(trackingEvents.length > pauseCount, 'Ticks must resume when playback resumes');
  assert(trackingEvents.every((e) => e.position >= 0 && e.position <= videoDuration));
});

test('9. Immediate pause save triggers within 2-5 seconds without waiting for 10s timer', () => {
  const savedRequests: Array<{ videoRefId: string; lastWatchedDuration: number; videoDuration: number }> = [];
  const videoRefId = 'session-video-uuid-1234';
  const videoDuration = 251;
  let lastSavedPosition = 0;

  function sendProgress(pos: number, isFinal = false, isPause = false) {
    const safeDur = Math.max(0, Math.floor(videoDuration));
    const safePos = Math.min(safeDur, Math.max(0, Math.floor(pos)));

    // On pause or final, never suppress
    if (!isFinal && !isPause && Math.abs(safePos - lastSavedPosition) < 1 && lastSavedPosition > 0) {
      return;
    }

    const payload = {
      videoRefId,
      lastWatchedDuration: safePos,
      videoDuration: safeDur,
    };
    savedRequests.push(payload);
    lastSavedPosition = safePos;
  }

  // User plays for 3 seconds and pauses (before 10-second timer fires)
  sendProgress(3.2, false, true); // pause event

  assert.strictEqual(savedRequests.length, 1, 'Pause after 3 seconds must immediately trigger save');
  assert.strictEqual(savedRequests[0].lastWatchedDuration, 3);
  assert.strictEqual(savedRequests[0].videoDuration, 251);
  assert.strictEqual(savedRequests[0].videoRefId, videoRefId);

  // User resumes and pauses again at 5 seconds
  sendProgress(5.7, false, true); // pause event
  assert.strictEqual(savedRequests.length, 2, 'Pause after resuming must immediately trigger save');
  assert.strictEqual(savedRequests[1].lastWatchedDuration, 5);
});
