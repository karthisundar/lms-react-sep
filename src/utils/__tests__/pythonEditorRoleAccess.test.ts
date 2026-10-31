import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

const BASE_URL = 'http://localhost:3100';

async function login(email: string, pass: string): Promise<string> {
  const payload = JSON.stringify({ email, password: Buffer.from(pass).toString('base64') });
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          const token = json.response?.data?.[0]?.token;
          if (!token) reject(new Error('No token returned for ' + email));
          else resolve(token);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function apiRequest(path: string, method: string, body?: any, token?: string): Promise<{ status: number; body: any }> {
  const payload = body ? JSON.stringify(body) : '';
  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(payload));
  }
  if (token) {
    headers['Authorization'] = token;
  }

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${path}`, {
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 500, body: JSON.parse(data || '{}') });
        } catch {
          resolve({ status: res.statusCode || 500, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(payload);
    req.end();
  });
}

test('1. User role can authenticate and obtain access token', async () => {
  const token = await login('joe@gmail.com', 'Welcome@123');
  assert.ok(token, 'Token must exist for User account');
  assert.strictEqual(typeof token, 'string');
});

test('2. User role can load associated Questions & Answers from real API', async () => {
  const token = await login('joe@gmail.com', 'Welcome@123');
  const res = await apiRequest('/api/question/getEditorQuestions', 'GET', undefined, token);
  assert.strictEqual(res.status, 200, 'User should receive 200 OK');
  const data = res.body?.response?.data;
  assert.ok(data, 'Data object must exist');
  assert.ok(Array.isArray(data.row), 'data.row must be an array of questions');
  assert.ok(data.row.length > 0, 'Questions list should not be empty');

  // Verify questions have questions and answers structure
  const firstQ = data.row[0];
  assert.ok(firstQ.questionRefId, 'Question must have questionRefId');
  assert.ok(firstQ.questionText, 'Question must have questionText');
  assert.ok(Array.isArray(firstQ.answers), 'Question must have answers array');
  assert.ok(firstQ.answers.length > 0, 'Answers must contain at least 1 answer option');
});

test('3. Valid Python syntax produces successful validation result', async () => {
  const token = await login('joe@gmail.com', 'Welcome@123');
  const validCode = `def reverse_string(s):
    return s[::-1]

result = reverse_string("Hello World")
print(result)
`;
  const res = await apiRequest('/api/question/checkSyntax', 'POST', { code: validCode }, token);
  assert.strictEqual(res.status, 200);
  const result = res.body?.response?.data;
  assert.strictEqual(result?.valid, true, 'Result valid must be true');
  assert.ok(result?.message.includes('valid'), 'Message should indicate syntax is valid');
});

test('4. Invalid Python syntax displays error message and line number', async () => {
  const token = await login('joe@gmail.com', 'Welcome@123');
  const invalidCode = `def broken_func(x)
    return x * 2
`;
  const res = await apiRequest('/api/question/checkSyntax', 'POST', { code: invalidCode }, token);
  assert.strictEqual(res.status, 200);
  const result = res.body?.response?.data;
  assert.strictEqual(result?.valid, false, 'Result valid must be false for syntax error');
  assert.strictEqual(result?.line, 1, 'Syntax error must be identified on line 1');
  assert.ok(result?.message, 'Error message must be present');
});

test('5. Empty code is handled gracefully with clear validation message', async () => {
  const token = await login('joe@gmail.com', 'Welcome@123');
  const res = await apiRequest('/api/question/checkSyntax', 'POST', { code: '   \n\t   ' }, token);
  assert.strictEqual(res.status, 200);
  const result = res.body?.response?.data;
  assert.strictEqual(result?.valid, false, 'Empty code should return valid: false');
  assert.ok(result?.message.toLowerCase().includes('empty'), 'Message should indicate code is empty');
});

test('6. Admin and other roles are strictly blocked from checkSyntax (HTTP 403 Forbidden)', async () => {
  const adminToken = await login('karthikeyankarthi27695@gmail.com', 'Welcome@123');
  const res = await apiRequest('/api/question/checkSyntax', 'POST', { code: 'print("test")' }, adminToken);
  assert.strictEqual(res.status, 403, 'Admin must be rejected with 403 Forbidden');
  assert.strictEqual(res.body?.response?.code, 'FORBIDDEN');
  assert.ok(res.body?.response?.message.includes('User role only'));
});

test('7. Admin and other roles are strictly blocked from getEditorQuestions (HTTP 403 Forbidden)', async () => {
  const adminToken = await login('karthikeyankarthi27695@gmail.com', 'Welcome@123');
  const res = await apiRequest('/api/question/getEditorQuestions', 'GET', undefined, adminToken);
  assert.strictEqual(res.status, 403, 'Admin must be rejected with 403 Forbidden');
  assert.strictEqual(res.body?.response?.code, 'FORBIDDEN');
  assert.ok(res.body?.response?.message.includes('User role only'));
});

test('8. Anonymous unauthenticated requests are rejected (HTTP 401 Unauthorized)', async () => {
  const res1 = await apiRequest('/api/question/checkSyntax', 'POST', { code: 'print("test")' }, undefined);
  assert.strictEqual(res1.status, 401, 'Anonymous syntax check must return 401 Unauthorized');

  const res2 = await apiRequest('/api/question/getEditorQuestions', 'GET', undefined, undefined);
  assert.strictEqual(res2.status, 401, 'Anonymous questions fetch must return 401 Unauthorized');
});

test('9. Existing application endpoints continue to function without regression', async () => {
  const adminToken = await login('karthikeyankarthi27695@gmail.com', 'Welcome@123');
  const joeToken = await login('joe@gmail.com', 'Welcome@123');

  // Admin can fetch sessions
  const adminSessions = await apiRequest('/api/sessionMaster/getAllSessions', 'GET', undefined, adminToken);
  assert.strictEqual(adminSessions.status, 200, 'Admin can fetch sessions');

  // User can fetch sessions
  const userSessions = await apiRequest('/api/sessionMaster/getAllSessions', 'GET', undefined, joeToken);
  assert.strictEqual(userSessions.status, 200, 'User can fetch sessions');
});
