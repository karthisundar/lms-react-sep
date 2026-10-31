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

async function testVideoStorage() {
  console.log('--- Test 1: Create Video by pasting complete S3 URL ---');
  const res1 = await fetch('http://localhost:3100/api/video/createVideo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      title: 'Full S3 URL Test',
      filename: 'lesson-s3.mp4',
      url: 'https://lesavoirfrance.s3.eu-west-2.amazonaws.com/videos/full-stack/module-01/lesson-01.mp4?v=2',
      sessionId: '48a93381-05d1-41ce-8492-b1ff4e5edb22',
      bucketId: '4825c00e-3423-4af7-8784-904af77291e9',
    }),
  });
  const data1 = await res1.json();
  console.log('Create result:', data1);

  // Inspect database
  const mysql = require('D:/Karthi/LMS/node_modules/mysql2/promise');
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'lms_service' });
  const [rows1] = await conn.query('SELECT videoId, videoRefId, title, filename, url FROM video_master WHERE title = "Full S3 URL Test" ORDER BY videoId DESC LIMIT 1');
  console.log('Persisted row in database:');
  console.log(rows1[0]);

  if (rows1[0]?.url === 'videos/full-stack/module-01/lesson-01.mp4') {
    console.log('PASS: Full URL was automatically stripped to relative object key!');
  } else {
    console.error('FAIL: Persisted URL is not stripped:', rows1[0]?.url);
  }

  console.log('\n--- Test 2: Create Video with path traversal attempt ---');
  const res2 = await fetch('http://localhost:3100/api/video/createVideo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      title: 'Path Traversal Attack Test',
      filename: '../../etc/passwd',
      url: '../../etc/passwd',
      sessionId: '48a93381-05d1-41ce-8492-b1ff4e5edb22',
      bucketId: '4825c00e-3423-4af7-8784-904af77291e9',
    }),
  });
  const data2 = await res2.json();
  console.log('Path traversal attempt response:', res2.status, data2.response?.code || data2.message);

  console.log('\n--- Test 3: Create Video with YouTube URL ---');
  const res3 = await fetch('http://localhost:3100/api/video/createVideo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: adminToken,
    },
    body: JSON.stringify({
      title: 'YouTube Test Video',
      filename: 'YouTube Demo',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      sessionId: '48a93381-05d1-41ce-8492-b1ff4e5edb22',
      bucketId: '4825c00e-3423-4af7-8784-904af77291e9',
    }),
  });
  const data3 = await res3.json();
  const [rows3] = await conn.query('SELECT videoId, videoRefId, title, filename, url FROM video_master WHERE title = "YouTube Test Video" ORDER BY videoId DESC LIMIT 1');
  console.log('YouTube Persisted row:', rows3[0]);

  if (rows3[0]?.url === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') {
    console.log('PASS: YouTube URL preserved for external playback!');
  }

  // Clean up test rows
  if (rows1[0]?.videoId) await conn.query('DELETE FROM video_master WHERE videoId = ?', [rows1[0].videoId]);
  if (rows3[0]?.videoId) await conn.query('DELETE FROM video_master WHERE videoId = ?', [rows3[0].videoId]);
  console.log('Cleaned up test rows.');

  await conn.end();
}

testVideoStorage().catch(console.error);
