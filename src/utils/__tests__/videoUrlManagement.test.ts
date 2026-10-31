import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVideoUrl,
  detectVideoSource,
  sanitizeVideoUrlForLogging,
} from '../videoUtils.ts';

test('1. Video URL Builder: Concatenates configured base URL, folder path, and filename', () => {
  const url = buildVideoUrl('lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: '/videos',
  });
  assert.equal(url, 'https://cdn.example.com/videos/lesson-01.mp4');
});

test('2. Video URL Builder: Handles base URL with or without trailing slashes and folder path with or without leading/trailing slashes', () => {
  const urlWithSlashes = buildVideoUrl('lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com/',
    folderPath: '/videos/',
  });
  assert.equal(urlWithSlashes, 'https://cdn.example.com/videos/lesson-01.mp4');

  const urlWithoutSlashes = buildVideoUrl('lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: 'videos',
  });
  assert.equal(urlWithoutSlashes, 'https://cdn.example.com/videos/lesson-01.mp4');

  const urlNoFolder = buildVideoUrl('lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: '',
  });
  assert.equal(urlNoFolder, 'https://cdn.example.com/lesson-01.mp4');
});

test('3. Video URL Builder: Supports nested relative object keys without repeating folder path', () => {
  const nested = buildVideoUrl('full-stack/module-01/lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: 'videos',
  });
  assert.equal(nested, 'https://cdn.example.com/videos/full-stack/module-01/lesson-01.mp4');

  // If the key already starts with the folder path, don't duplicate it
  const alreadyPrefixed = buildVideoUrl('videos/module-01/lesson-01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: 'videos',
  });
  assert.equal(alreadyPrefixed, 'https://cdn.example.com/videos/module-01/lesson-01.mp4');
});

test('4. Video URL Builder: Rejects empty, whitespace, or invalid filenames', () => {
  assert.equal(buildVideoUrl(''), '');
  assert.equal(buildVideoUrl('   '), '');
  assert.equal(buildVideoUrl(null as unknown as string), '');
  assert.equal(buildVideoUrl(undefined as unknown as string), '');
});

test('5. Video URL Builder: Rejects path traversal attacks and unsafe protocols', () => {
  // Directory traversal
  assert.equal(buildVideoUrl('../../etc/passwd', { baseUrl: 'https://cdn.example.com' }), '');
  assert.equal(buildVideoUrl('..\\..\\windows\\system32', { baseUrl: 'https://cdn.example.com' }), '');

  // Unsafe script protocols
  assert.equal(buildVideoUrl('javascript:alert(1)'), '');
  assert.equal(buildVideoUrl('data:text/html,<script>alert(1)</script>'), '');
});

test('6. Video URL Builder: Avoids double-encoding existing percent-encoded characters', () => {
  const unencoded = buildVideoUrl('lesson 01.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: 'videos',
  });
  assert.equal(unencoded, 'https://cdn.example.com/videos/lesson%2001.mp4');

  const alreadyEncoded = buildVideoUrl('lesson%2001.mp4', {
    baseUrl: 'https://cdn.example.com',
    folderPath: 'videos',
  });
  // Must NOT become lesson%252001.mp4
  assert.equal(alreadyEncoded, 'https://cdn.example.com/videos/lesson%2001.mp4');
});

test('7. Video URL Builder: YouTube and external provider URLs bypass S3/CDN base URL', () => {
  const ytWatch = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  assert.equal(buildVideoUrl(ytWatch, { baseUrl: 'https://cdn.example.com', folderPath: 'videos' }), ytWatch);

  const youtuBe = 'https://youtu.be/dQw4w9WgXcQ';
  assert.equal(buildVideoUrl(youtuBe, { baseUrl: 'https://cdn.example.com', folderPath: 'videos' }), youtuBe);

  const vimeo = 'https://vimeo.com/76979871';
  assert.equal(buildVideoUrl(vimeo, { baseUrl: 'https://cdn.example.com', folderPath: 'videos' }), vimeo);

  const drive = 'https://drive.google.com/file/d/1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH/view';
  assert.equal(buildVideoUrl(drive, { baseUrl: 'https://cdn.example.com', folderPath: 'videos' }), drive);
});

test('8. Video Source Detection: Detects YouTube, Vimeo, Google Drive, and Direct Video Sources', () => {
  const ytSource = detectVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(ytSource.type, 'youtube');
  assert.equal(ytSource.videoId, 'dQw4w9WgXcQ');

  const vimeoSource = detectVideoSource('https://vimeo.com/76979871');
  assert.equal(vimeoSource.type, 'vimeo');
  assert.equal(vimeoSource.videoId, '76979871');

  const driveSource = detectVideoSource('https://drive.google.com/file/d/1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH/view');
  assert.equal(driveSource.type, 'google-drive');
  assert.equal(driveSource.videoId, '1cjPBZQYu5TAdW0XOtXcXge_IeOw2e-nH');

  const directSource = detectVideoSource('https://cdn.example.com/videos/lesson-01.mp4');
  assert.equal(directSource.type, 'direct');
});

test('9. Safe Logging: Strips access tokens and query parameters from video URLs', () => {
  const signedUrl = 'https://cdn.example.com/videos/lesson-01.mp4?X-Amz-Signature=secret123&X-Amz-Expires=3600';
  const sanitized = sanitizeVideoUrlForLogging(signedUrl);
  assert.equal(sanitized, 'https://cdn.example.com/videos/lesson-01.mp4');
  assert.ok(!sanitized.includes('secret123'));
});
