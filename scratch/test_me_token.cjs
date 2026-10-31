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
    id: 1,
    user_id: 1,
    user_ref_id: 'a545e98a-77ab-11f1-8ceb-546ceb84c7c6',
    email: 'karthikeyankarthi27695@gmail.com',
    role_id: 1,
    role: 'admin'
  },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

(async () => {
  const res = await fetch('http://localhost:3100/api/user/me', {
    headers: { Authorization: 'Bearer ' + adminToken }
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Data:', JSON.stringify(data, null, 2));
})();
