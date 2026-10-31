const jwt = require('D:/Karthi/LMS/node_modules/jsonwebtoken');
const fs = require('fs');
const http = require('http');

// Read private key from jwt.utils.ts
const jwtUtilsContent = fs.readFileSync('D:/Karthi/LMS/src/components/auth/jwt.utils.ts', 'utf8');
const startTag = '-----BEGIN PRIVATE KEY-----';
const endTag = '-----END PRIVATE KEY-----';
const privateKey = jwtUtilsContent.substring(
  jwtUtilsContent.indexOf(startTag),
  jwtUtilsContent.indexOf(endTag) + endTag.length
);

// 1. Generate Admin Token (role_id = 1)
const adminToken = jwt.sign(
  { id: 1, email: 'admin@lms.com', role_id: 1, role: 'admin' },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

// 2. Generate Student User Token (role_id = 2)
const userToken = jwt.sign(
  { id: 2, email: 'student@lms.com', role_id: 2, role: 'user' },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

function makeRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 3100,
      path,
      method,
      headers
    }, (res) => {
      let resBody = '';
      res.on('data', c => resBody += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(resBody) }); }
        catch (e) { resolve({ status: res.statusCode, body: resBody }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('--- Test Admin Auth: No Token ---');
  const noTokenRes = await makeRequest('GET', '/api/admin/contact-enquiries', null);
  console.log('No token status (expect 401):', noTokenRes.status, noTokenRes.body.response?.code);

  console.log('\n--- Test Admin Auth: Non-Admin Token (Student) ---');
  const userTokenRes = await makeRequest('GET', '/api/admin/contact-enquiries', userToken);
  console.log('User token status (expect 403):', userTokenRes.status, userTokenRes.body.response?.code);

  console.log('\n--- Test Admin Auth: Admin Token (List Enquiries) ---');
  const adminListRes = await makeRequest('GET', '/api/admin/contact-enquiries?page=1&limit=10', adminToken);
  console.log('Admin list status (expect 200):', adminListRes.status);
  console.log('Enquiries count:', adminListRes.body.response?.data?.length);
  console.log('Pagination:', adminListRes.body.response?.pagination);

  console.log('\n--- Test Admin Auth: Get Single Enquiry with Logs ---');
  const singleRes = await makeRequest('GET', '/api/admin/contact-enquiries/1', adminToken);
  console.log('Single enquiry status (expect 200):', singleRes.status);
  console.log('Enquiry ID:', singleRes.body.response?.data?.id);
  console.log('Email Logs count:', singleRes.body.response?.data?.emailLogs?.length);

  console.log('\n--- Test Admin Auth: Update Status to IN_PROGRESS ---');
  const updateRes = await makeRequest('PATCH', '/api/admin/contact-enquiries/1/status', adminToken, { status: 'IN_PROGRESS' });
  console.log('Update status result:', updateRes.status, updateRes.body.response?.data?.status);

  console.log('\n--- Test Admin Auth: Retry Email (Expect 202 Accepted) ---');
  const retryRes = await makeRequest('POST', '/api/admin/contact-enquiries/1/retry-email', adminToken);
  console.log('Retry result status:', retryRes.status);
  console.log('Retry result body:', retryRes.body);
})();
