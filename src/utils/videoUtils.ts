/**
 * Utility functions for detecting video providers and extracting identifiers.
 */

export type VideoProvider = 'youtube' | 'html5';

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=lU40CPN7Ww0
 * - https://youtu.be/lU40CPN7Ww0
 * - https://www.youtube.com/embed/lU40CPN7Ww0
 * - https://www.youtube.com/shorts/lU40CPN7Ww0
 * - https://www.youtube.com/v/lU40CPN7Ww0
 * - URLs with additional query params (e.g. ?t=10s, &feature=share)
 *
 * Returns the video ID string if valid, or null otherwise.
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
    // Fallback regex matching in case of non-standard protocol or malformed URL
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regex);
    if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns the video provider based on URL detection.
 * Future providers (Vimeo, AWS S3, CloudFront) can be added here.
 */
export function getVideoProvider(url?: string | null): VideoProvider {
  return getYouTubeVideoId(url) ? 'youtube' : 'html5';
}

/**
 * Builds the embeddable YouTube iframe URL for a given video ID.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
}
