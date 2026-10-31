const jwt = require('D:/Karthi/LMS/node_modules/jsonwebtoken');
const fs = require('fs');

const jwtUtilsContent = fs.readFileSync('D:/Karthi/LMS/src/components/auth/jwt.utils.ts', 'utf8');
const startTag = '-----BEGIN PRIVATE KEY-----';
const endTag = '-----END PRIVATE KEY-----';
const privateKey = jwtUtilsContent.substring(
  jwtUtilsContent.indexOf(startTag),
  jwtUtilsContent.indexOf(endTag) + endTag.length
);

const adminToken = jwt.sign(
  {
    user_ref_id: 'a545e98a-77ab-11f1-8ceb-546ceb84c7c6',
    email: 'karthikeyankarthi27695@gmail.com',
    name: 'Karthi',
    role_id: 1,
    role: 'admin',
  },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1y' }
);

async function testDuplicateEmail() {
  console.log('--- Test 1: Duplicate Email Rejection (Case variation: JOE@GMAIL.COM) ---');
  const res1 = await fetch('http://localhost:3100/api/user/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      name: 'Duplicate Joe',
      email: 'JOE@gmail.com',
      password: Buffer.from('Secret123!').toString('base64'),
      role: 'user',
    }),
  });

  const data1 = await res1.json();
  console.log('Status code:', res1.status);
  console.log('Response body:', JSON.stringify(data1, null, 2));

  if (res1.status === 400 || res1.status === 409) {
    if (data1.code === 'EMAIL_ALREADY_EXISTS') {
      console.log('PASS: Correctly rejected duplicate email with code EMAIL_ALREADY_EXISTS');
    } else {
      console.log('Rejected with code:', data1.code);
    }
  } else {
    console.error('FAIL: Expected 400 or 409 for duplicate email, got:', res1.status);
  }

  console.log('\n--- Test 2: Invalid Email Format Rejection ---');
  const res2 = await fetch('http://localhost:3100/api/user/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      name: 'Invalid Email User',
      email: 'not-an-email',
      password: Buffer.from('Secret123!').toString('base64'),
      role: 'user',
    }),
  });

  const data2 = await res2.json();
  console.log('Status code:', res2.status);
  console.log('Response body:', JSON.stringify(data2, null, 2));

  console.log('\n--- Test 3: Edit User Retaining Same Email ---');
  // Vino has user_ref_id: 5551bff3-9b4e-46cc-bcbc-48c5ce0442f2 and email: vino@gmail.com
  const res3 = await fetch('http://localhost:3100/api/user/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      user_ref_id: '5551bff3-9b4e-46cc-bcbc-48c5ce0442f2',
      name: 'Vino Updated',
      email: 'vino@gmail.com',
      role: 'lecturer',
    }),
  });

  const data3 = await res3.json();
  console.log('Status code (expect 200):', res3.status);
  console.log('Response body:', JSON.stringify(data3, null, 2));

  console.log('\n--- Test 4: Edit User Attempting to Steal Another User\'s Email ---');
  // Vino attempts to update email to joe@gmail.com
  const res4 = await fetch('http://localhost:3100/api/user/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      user_ref_id: '5551bff3-9b4e-46cc-bcbc-48c5ce0442f2',
      name: 'Vino Impersonating Joe',
      email: 'JOE@GMAIL.COM',
      role: 'lecturer',
    }),
  });

  const data4 = await res4.json();
  console.log('Status code (expect 400 or 409):', res4.status);
  console.log('Response body:', JSON.stringify(data4, null, 2));
}

testDuplicateEmail().catch(console.error);
