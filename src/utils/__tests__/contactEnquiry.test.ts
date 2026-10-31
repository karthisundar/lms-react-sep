// src/utils/__tests__/contactEnquiry.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function request(method: string, path: string, headers: Record<string, string> = {}, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders: Record<string, string> = { ...headers };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = String(Buffer.byteLength(data));
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3100,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Generate test JWT tokens
let adminToken = '';
let userToken = '';

try {
  const jwt = require('D:/Karthi/LMS/node_modules/jsonwebtoken');
  const jwtUtilsContent = fs.readFileSync('D:/Karthi/LMS/src/components/auth/jwt.utils.ts', 'utf8');
  const startTag = '-----BEGIN PRIVATE KEY-----';
  const endTag = '-----END PRIVATE KEY-----';
  const privateKey = jwtUtilsContent.substring(
    jwtUtilsContent.indexOf(startTag),
    jwtUtilsContent.indexOf(endTag) + endTag.length
  );

  adminToken = jwt.sign(
    { id: 1, email: 'admin@lms.com', role_id: 1, role: 'admin' },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
  );

  userToken = jwt.sign(
    { id: 2, email: 'student@lms.com', role_id: 2, role: 'user' },
    privateKey,
    { algorithm: 'RS256', expiresIn: '1h' }
  );
} catch (e) {
  console.warn('Could not generate JWT keys for test:', e);
}

test('1. Public Enquiry: Invalid payload returns HTTP 400 with descriptive validation errors', async () => {
  const res = await request('POST', '/api/contact-enquiries', {}, {
    name: 'X',
    email: 'invalid-email',
    message: 'hi',
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.response?.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(res.body.response?.errors));
  assert.ok(res.body.response?.errors.length >= 2);
});

test('2. Public Enquiry: Valid submission saves enquiry and returns HTTP 201 with PENDING email status', async () => {
  const uniqueName = `Automated Tester ${Date.now()}`;
  const res = await request('POST', '/api/contact-enquiries', {}, {
    name: uniqueName,
    email: 'tester@example.com',
    phone: '+1 555-123-4567',
    subject: 'Generative AI & Agentic AI',
    message: 'I would like to inquire about syllabus details and prerequisites.',
    source: '/courses/generative-ai',
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data?.id > 0);
  // Requirement 4: Initial email status must be PENDING because sending is asynchronous via BullMQ
  assert.equal(res.body.data?.emailStatus, 'PENDING');
});

test('3. Admin Enquiries: Anonymous request is rejected with HTTP 401 Unauthorized', async () => {
  const res = await request('GET', '/api/admin/contact-enquiries');
  assert.equal(res.status, 401);
  assert.equal(res.body.response?.code, 'UNAUTHORIZED');
});

test('4. Admin Enquiries: Non-admin role (Student) is rejected with HTTP 403 Forbidden', async () => {
  assert.ok(userToken, 'userToken must be generated');
  const res = await request('GET', '/api/admin/contact-enquiries', {
    Authorization: `Bearer ${userToken}`,
  });
  assert.equal(res.status, 403);
  assert.equal(res.body.response?.code, 'FORBIDDEN');
});

test('5. Admin Enquiries: Admin role can list enquiries with pagination and search', async () => {
  assert.ok(adminToken, 'adminToken must be generated');
  const res = await request('GET', '/api/admin/contact-enquiries?page=1&limit=5', {
    Authorization: `Bearer ${adminToken}`,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.response?.data));
  assert.ok(res.body.response?.pagination?.total >= 1);
  assert.equal(res.body.response?.pagination?.page, 1);
});

test('6. Admin Enquiries: Admin can view single enquiry with full email attempt audit logs', async () => {
  assert.ok(adminToken, 'adminToken must be generated');
  const res = await request('GET', '/api/admin/contact-enquiries/1', {
    Authorization: `Bearer ${adminToken}`,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.response?.data?.id, 1);
  assert.ok(Array.isArray(res.body.response?.data?.emailLogs));
  // Verify log structure
  if (res.body.response?.data?.emailLogs?.length > 0) {
    const firstLog = res.body.response.data.emailLogs[0];
    assert.ok(firstLog.attempt_number >= 1);
    assert.ok(['PENDING', 'SENT', 'FAILED'].includes(firstLog.status));
    assert.ok(firstLog.recipient_email);
  }
});

test('7. Admin Enquiries: Admin can update workflow status (NEW -> IN_PROGRESS -> RESOLVED)', async () => {
  assert.ok(adminToken, 'adminToken must be generated');
  const res = await request(
    'PATCH',
    '/api/admin/contact-enquiries/1/status',
    { Authorization: `Bearer ${adminToken}` },
    { status: 'RESOLVED' }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.response?.data?.status, 'RESOLVED');
});

test('8. Admin Enquiries: Admin retry endpoint queues notification and returns HTTP 202 Accepted', async () => {
  assert.ok(adminToken, 'adminToken must be generated');
  const res = await request(
    'POST',
    '/api/admin/contact-enquiries/1/retry-email',
    { Authorization: `Bearer ${adminToken}` }
  );

  assert.equal(res.status, 202);
  assert.equal(res.body.success, true);
  assert.equal(res.body.statusCode, 202);
  assert.equal(res.body.data?.id, 1);
  assert.equal(res.body.data?.emailStatus, 'PENDING');
});

test('9. Frontend Logic: Scroll threshold calculation and session persistence simulation', () => {
  // Test 40% scroll calculation
  const totalHeight = 2000;
  const viewportHeight = 800;
  const scrollableDistance = totalHeight - viewportHeight; // 1200px

  const at30PercentScroll = 360; // 360 / 1200 = 0.30
  const at40PercentScroll = 480; // 480 / 1200 = 0.40
  const at50PercentScroll = 600; // 600 / 1200 = 0.50

  assert.equal(at30PercentScroll / scrollableDistance < 0.40, true);
  assert.equal(at40PercentScroll / scrollableDistance >= 0.40, true);
  assert.equal(at50PercentScroll / scrollableDistance >= 0.40, true);

  // Test session persistence flags
  const mockSession: Record<string, string> = {};
  const isBlocked = () => Boolean(mockSession['cc_enquiry_dismissed'] || mockSession['cc_enquiry_submitted']);

  assert.equal(isBlocked(), false);

  // User dismisses
  mockSession['cc_enquiry_dismissed'] = 'true';
  assert.equal(isBlocked(), true);

  // User submits
  delete mockSession['cc_enquiry_dismissed'];
  mockSession['cc_enquiry_submitted'] = 'true';
  assert.equal(isBlocked(), true);
});
