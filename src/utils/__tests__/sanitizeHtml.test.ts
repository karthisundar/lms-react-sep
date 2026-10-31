import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeHtml } from '../sanitizeHtml.ts';

describe('sanitizeHtml Security Utility', () => {
  it('should remove script tags completely', () => {
    const malicious = '<p>Normal text</p><script>alert("XSS")</script>';
    const cleaned = sanitizeHtml(malicious);
    assert.strictEqual(cleaned.includes('<script>'), false);
    assert.strictEqual(cleaned.includes('alert("XSS")'), false);
    assert.strictEqual(cleaned.includes('<p>Normal text</p>'), true);
  });

  it('should remove iframe tags completely', () => {
    const malicious = '<div>Content</div><iframe src="http://evil.com"></iframe>';
    const cleaned = sanitizeHtml(malicious);
    assert.strictEqual(cleaned.includes('<iframe'), false);
    assert.strictEqual(cleaned.includes('evil.com'), false);
    assert.strictEqual(cleaned.includes('Content'), true);
  });

  it('should strip inline onerror/onload event handlers', () => {
    const malicious = '<img src="x" onerror="stealCookies()" onload="doEvil()" />';
    const cleaned = sanitizeHtml(malicious);
    assert.strictEqual(cleaned.includes('onerror='), false);
    assert.strictEqual(cleaned.includes('stealCookies()'), false);
    assert.strictEqual(cleaned.includes('onload='), false);
  });

  it('should strip javascript: URLs', () => {
    const malicious = '<a href="javascript:alert(1)">Click here</a>';
    const cleaned = sanitizeHtml(malicious);
    assert.strictEqual(cleaned.includes('javascript:'), false);
  });

  it('should preserve safe document HTML elements', () => {
    const safe = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italics</em></p>';
    const cleaned = sanitizeHtml(safe);
    assert.strictEqual(cleaned.includes('<h1>Title</h1>'), true);
    assert.strictEqual(cleaned.includes('<strong>bold</strong>'), true);
  });
});
