/**
 * Lightweight, zero-dependency client-side HTML sanitizer for document previews.
 * Neutralizes XSS by stripping dangerous elements (scripts, iframes, objects)
 * and dangerous attributes (inline event handlers like onerror, onload, and javascript: URIs).
 */

const BLOCKED_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'base',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'applet',
  'meta',
  'link',
  'frame',
  'frameset',
]);

const ALLOWED_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:', 'blob:', 'data:image/'];

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return true;
  }
  return ALLOWED_SCHEMES.some((scheme) => trimmed.startsWith(scheme));
}

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  // If running in browser with DOMParser
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // 1. Remove all blocked tags
      BLOCKED_TAGS.forEach((tag) => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach((el) => el.remove());
      });

      // 2. Clean attributes across all remaining elements
      const allElements = doc.querySelectorAll('*');
      allElements.forEach((el) => {
        const attributesToRemove: string[] = [];

        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          const name = attr.name.toLowerCase();
          const value = attr.value;

          // Strip all inline event handlers (on*)
          if (name.startsWith('on')) {
            attributesToRemove.push(attr.name);
            continue;
          }

          // Validate link targets and sources
          if (name === 'href' || name === 'src' || name === 'xlink:href') {
            if (!isSafeUrl(value)) {
              attributesToRemove.push(attr.name);
            }
          }

          // Strip style attributes containing expression(...) or javascript:
          if (name === 'style') {
            const lowerStyle = value.toLowerCase();
            if (lowerStyle.includes('expression(') || lowerStyle.includes('javascript:')) {
              attributesToRemove.push(attr.name);
            }
          }
        }

        attributesToRemove.forEach((attrName) => el.removeAttribute(attrName));

        // If it's a link, enforce rel="noopener noreferrer"
        if (el.tagName.toLowerCase() === 'a') {
          el.setAttribute('rel', 'noopener noreferrer');
          el.setAttribute('target', '_blank');
        }
      });

      return doc.body.innerHTML;
    } catch {
      // Fallback below
    }
  }

  // Regex fallback for non-DOM / test environments
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^"'\s]*/gi, '');
}

export default sanitizeHtml;
