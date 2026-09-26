/**
 * Universal Video Source Detection and URL utilities.
 * Supports: YouTube, Vimeo, Google Drive, HLS, DASH, Direct/S3/CloudFront/CDN.
 */

export type VideoSourceType =
  | 'youtube'
  | 'vimeo'
  | 'google-drive'
  | 'hls'
  | 'dash'
  | 'direct'
  | 'unknown';

export interface DetectedVideoSource {
  type: VideoSourceType;
  url: string;
  videoId?: string;
  previewUrl?: string;
}

// Backward compatibility alias
export type VideoProvider = 'youtube' | 'html5' | 'vimeo' | 'google-drive' | 'unknown';

export const DIRECT_VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.ogg',
  '.ogv',
  '.mov',
  '.m4v',
  '.mp4v',
  '.mkv',
];

export const NON_VIDEO_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.rar',
  '.tar',
  '.gz',
  '.7z',
  '.exe',
  '.apk',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.bmp',
  '.tiff',
  '.html',
  '.htm',
  '.css',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.xml',
  '.txt',
  '.csv',
  '.md',
];

/**
 * Strips query parameters and sensitive tokens from a video URL for safe logging.
 */
export function sanitizeVideoUrlForLogging(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  try {
    const u = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return `${u.origin}${u.pathname}`;
  } catch {
    return trimmed.split('?')[0].split('#')[0];
  }
}

/**
 * Extracts YouTube 11-character video ID from various YouTube URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function getYouTubeVideoId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const isYouTubeDomain =
      hostname === 'youtube.com' ||
      hostname.endsWith('.youtube.com') ||
      hostname === 'youtu.be' ||
      hostname === 'youtube-nocookie.com' ||
      hostname.endsWith('.youtube-nocookie.com');

    if (!isYouTubeDomain) {
      return null;
    }

    // 1. youtu.be/<id>
    if (hostname === 'youtu.be') {
      const match = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    // 2. youtube.com/watch?v=<id>
    if (parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }

    // 3. youtube.com/embed/<id>
    const embedMatch = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // 4. youtube.com/shorts/<id>
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // 5. youtube.com/v/<id>
    const vMatch = parsed.pathname.match(/^\/v\/([a-zA-Z0-9_-]{11})/);
    if (vMatch) return vMatch[1];
  } catch {
    // Fallback regex
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = trimmed.match(regex);
    if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Builds the embeddable YouTube iframe URL.
 */
export function getYouTubeEmbedUrl(videoId: string, startTime = 0): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  const start = startTime > 0 ? `&start=${Math.floor(startTime)}` : '';
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1${origin}${start}`;
}

/**
 * Extracts Google Drive file ID from various Google Drive share URLs.
 *
 * Supported formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/preview
 */
export function getGoogleDriveFileId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const isDriveDomain =
      hostname === 'drive.google.com' ||
      hostname.endsWith('.drive.google.com') ||
      hostname === 'docs.google.com';

    if (!isDriveDomain) return null;

    // Pattern 1: /file/d/FILE_ID/...
    const fileDMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

    // Pattern 2: ?id=FILE_ID
    const idParam = parsed.searchParams.get('id');
    if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) return idParam;

    // Pattern 3: /d/FILE_ID
    const dMatch = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) return dMatch[1];
  } catch {
    const regex = /(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i;
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Extracts Vimeo video ID from various Vimeo URLs.
 *
 * Supported formats:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 * - https://vimeo.com/channels/staffpicks/123456789
 */
export function getVimeoVideoId(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const isVimeoDomain =
      hostname === 'vimeo.com' ||
      hostname.endsWith('.vimeo.com') ||
      hostname === 'player.vimeo.com';

    if (!isVimeoDomain) return null;

    // player.vimeo.com/video/<id>
    if (hostname === 'player.vimeo.com') {
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      if (match && match[1]) return match[1];
    }

    // vimeo.com/<id> or channels/<id>
    const match = parsed.pathname.match(/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|\/)(\d+)/);
    if (match && match[1]) return match[1];
  } catch {
    const regex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/i;
    const match = trimmed.match(regex);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * UNIVERSAL SOURCE DETECTION
 *
 * Detection Priority:
 * 1. YouTube
 * 2. Vimeo
 * 3. Google Drive
 * 4. HLS (.m3u8)
 * 5. DASH (.mpd)
 * 6. Direct / AWS S3 / CloudFront / CDN
 * 7. Unknown
 */
export function detectVideoSource(
  rawUrl?: string | null,
  mimeType?: string | null
): DetectedVideoSource {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unknown', url: '' };
  }

  const url = rawUrl.trim();
  if (!url) {
    return { type: 'unknown', url: '' };
  }

  const mime = (mimeType || '').toLowerCase().trim();

  // 1. YouTube
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return {
      type: 'youtube',
      url,
      videoId: ytId,
      previewUrl: getYouTubeEmbedUrl(ytId),
    };
  }

  // 2. Vimeo
  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo',
      url,
      videoId: vimeoId,
      previewUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  // 3. Google Drive
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return {
      type: 'google-drive',
      url,
      videoId: driveId,
      previewUrl: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }

  // Parse path and protocol (stripping queries and hashes for extension matching)
  let pathname = '';
  let hostname = '';
  let protocol = '';

  try {
    const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
    pathname = parsed.pathname.toLowerCase();
    hostname = parsed.hostname.toLowerCase();
    protocol = parsed.protocol.toLowerCase();
  } catch {
    pathname = url.split('?')[0].split('#')[0].toLowerCase();
  }

  // Only http/https supported for web video playback
  if (protocol && protocol !== 'http:' && protocol !== 'https:') {
    return { type: 'unknown', url };
  }

  // 4. HLS (.m3u8)
  if (
    pathname.endsWith('.m3u8') ||
    mime.includes('application/x-mpegurl') ||
    mime.includes('application/vnd.apple.mpegurl')
  ) {
    return { type: 'hls', url };
  }

  // 5. DASH (.mpd)
  if (pathname.endsWith('.mpd') || mime.includes('application/dash+xml')) {
    return { type: 'dash', url };
  }

  // 6. Direct / AWS S3 / CloudFront / CDN
  // Check known direct video extensions
  const hasDirectVideoExt = DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (hasDirectVideoExt || mime.startsWith('video/')) {
    return { type: 'direct', url };
  }

  // Check known non-video extensions (reject .pdf, .zip, .png, etc.)
  const hasNonVideoExt = NON_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  if (hasNonVideoExt) {
    return { type: 'unknown', url };
  }

  // S3 or CloudFront or CDN URLs without extension (e.g. S3 keys like /video/abc123)
  const isS3OrCloudFrontOrCdn =
    hostname.endsWith('.amazonaws.com') ||
    hostname.endsWith('.cloudfront.net') ||
    hostname.includes('s3') ||
    hostname.includes('cdn');

  if (isS3OrCloudFrontOrCdn) {
    return { type: 'direct', url };
  }

  // Fallback for valid HTTP/HTTPS endpoints without non-video extensions
  if (protocol === 'http:' || protocol === 'https:') {
    return { type: 'direct', url };
  }

  return { type: 'unknown', url };
}

/**
 * Backward compatibility provider mapping
 */
export function getVideoProvider(url?: string | null): VideoProvider {
  const source = detectVideoSource(url);
  switch (source.type) {
    case 'youtube':
      return 'youtube';
    case 'vimeo':
      return 'vimeo';
    case 'google-drive':
      return 'google-drive';
    case 'direct':
    case 'hls':
    case 'dash':
      return 'html5';
    default:
      return 'unknown';
  }
}
