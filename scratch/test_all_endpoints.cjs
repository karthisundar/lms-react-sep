const fs = require('fs');
const jwt = require('D:/Karthi/LMS/node_modules/jsonwebtoken');

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

const userToken = jwt.sign(
  {
    id: 6,
    user_id: 6,
    user_ref_id: 'd5eb907c-824d-4b2c-8d94-3898f246f0e5',
    email: 'joe@gmail.com',
    role_id: 2,
    role: 'user'
  },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

const BASE = 'http://localhost:3100';

async function req(path, method = 'GET', token = adminToken, body = null) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, data };
}

const results = [];

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓' : '✗'} ${name} ${detail ? '(' + detail + ')' : ''}`);
}

(async () => {
  console.log('====================================================');
  console.log('       FULL-STACK API & INTEGRATION AUDIT SUITE     ');
  console.log('====================================================\n');

  // 1. Auth & User
  console.log('--- 1. Auth & User Controller ---');
  {
    const r = await req('/api/user/clientLabel', 'GET', null);
    check('GET /api/user/clientLabel returns 200', r.status === 200);
  }
  {
    const r = await req('/api/user/me', 'GET', adminToken);
    check('GET /api/user/me with admin token returns 200', r.status === 200 && r.data?.response?.data?.user_id === 1);
  }
  {
    const r = await req('/api/user/me', 'GET', null);
    check('GET /api/user/me without token returns 401 or 404', r.status === 401 || r.status === 404);
  }
  {
    const r = await req('/api/user/getUserDetails?userRefId=a545e98a-77ab-11f1-8ceb-546ceb84c7c6', 'GET', adminToken);
    check('GET /api/user/getUserDetails returns 200', r.status === 200 && r.data?.response?.data?.name === 'Karthi');
  }
  {
    const r = await req('/api/user/getAllUsers', 'GET', adminToken);
    check('GET /api/user/getAllUsers returns 200', r.status === 200 && Array.isArray(r.data?.response?.data?.data || r.data?.response?.data));
  }
  {
    const r = await req('/api/user/logout', 'POST', adminToken);
    check('POST /api/user/logout returns 200', r.status === 200);
  }

  // 2. Bucket Master
  console.log('\n--- 2. Bucket Master Controller ---');
  let testBucketRefId = null;
  {
    const r = await req('/api/bucketMaster/getAllBuckets', 'GET', adminToken);
    check('GET /api/bucketMaster/getAllBuckets returns 200', r.status === 200);
  }
  {
    const r = await req('/api/bucketMaster/createBucket', 'POST', adminToken, {
      bucketName: 'audit-test-bucket',
      serviceUrl: 'https://audit-bucket.s3.amazonaws.com',
      status: 'active'
    });
    check('POST /api/bucketMaster/createBucket returns 200', r.status === 200);
    testBucketRefId = r.data?.response?.data?.bucketRefId;
  }
  if (testBucketRefId) {
    const r = await req(`/api/bucketMaster/getBucket?bucketRefId=${testBucketRefId}`, 'GET', adminToken);
    check('GET /api/bucketMaster/getBucket returns 200', r.status === 200);
  }

  // 3. Course Master
  console.log('\n--- 3. Course Master Controller ---');
  let testCourseRefId = null;
  {
    const r = await req('/api/course/getAllCourses', 'GET', adminToken);
    check('GET /api/course/getAllCourses returns 200', r.status === 200);
  }
  {
    const r = await req('/api/course/createCourse', 'POST', adminToken, {
      courseName: 'Audit Test Course',
      description: 'Course created for end-to-end integration audit',
      status: 'published'
    });
    check('POST /api/course/createCourse returns 200', r.status === 200);
    testCourseRefId = r.data?.response?.data?.courseRefId;
  }
  {
    const r = await req('/api/course/createCourse', 'POST', adminToken, {
      courseName: ''
    });
    check('POST /api/course/createCourse without name returns 400', r.status === 400, r.data?.message || r.data?.code);
  }
  if (testCourseRefId) {
    const r = await req(`/api/course/getCourse?courseRefId=${testCourseRefId}`, 'GET', adminToken);
    check('GET /api/course/getCourse returns 200', r.status === 200 && r.data?.response?.data?.courseName === 'Audit Test Course');
  }

  // 4. Module Master
  console.log('\n--- 4. Module Master Controller ---');
  let testModuleRefId = null;
  {
    const r = await req('/api/module/getAllModules', 'GET', adminToken);
    check('GET /api/module/getAllModules returns 200', r.status === 200);
  }
  if (testCourseRefId) {
    const r = await req('/api/module/createModule', 'POST', adminToken, {
      courseRefId: testCourseRefId,
      moduleName: 'Audit Test Module',
      description: 'Module created for audit',
      status: 'active'
    });
    check('POST /api/module/createModule returns 200', r.status === 200);
    testModuleRefId = r.data?.response?.data?.moduleRefId;
  }
  {
    const r = await req('/api/module/createModule', 'POST', adminToken, {
      moduleName: ''
    });
    check('POST /api/module/createModule without name returns 400', r.status === 400, r.data?.message || r.data?.code);
  }
  if (testModuleRefId) {
    const r = await req(`/api/module/getModule?moduleRefId=${testModuleRefId}`, 'GET', adminToken);
    check('GET /api/module/getModule returns 200', r.status === 200);
  }

  // 5. Session Master
  console.log('\n--- 5. Session Master Controller ---');
  let testSessionRefId = null;
  {
    const r = await req('/api/sessionMaster/getAllSessions', 'GET', adminToken);
    check('GET /api/sessionMaster/getAllSessions returns 200', r.status === 200);
  }
  {
    const r = await req('/api/sessionMaster/createSession', 'POST', adminToken, {
      sessionName: 'Audit Test Session',
      sessionDate: '2026-11-01',
      description: 'Session for audit',
      status: 'draft'
    });
    check('POST /api/sessionMaster/createSession returns 200', r.status === 200);
    testSessionRefId = r.data?.response?.data?.sessionRefId;
  }
  {
    const r = await req('/api/sessionMaster/createSession', 'POST', adminToken, {
      sessionName: ''
    });
    check('POST /api/sessionMaster/createSession without name returns 400', r.status === 400, r.data?.message || r.data?.code);
  }
  if (testSessionRefId) {
    const r = await req(`/api/sessionMaster/getSession?sessionRefId=${testSessionRefId}`, 'GET', adminToken);
    check('GET /api/sessionMaster/getSession returns 200', r.status === 200);
  }
  {
    const r = await req('/api/sessionMaster/getAllUserSessionMappings', 'GET', adminToken);
    check('GET /api/sessionMaster/getAllUserSessionMappings returns 200', r.status === 200);
  }

  // 6. Video Master
  console.log('\n--- 6. Video Master Controller ---');
  let testVideoRefId = null;
  {
    const r = await req('/api/video/getAllVideos', 'GET', adminToken);
    check('GET /api/video/getAllVideos returns 200', r.status === 200);
  }
  if (testBucketRefId && testSessionRefId) {
    const r = await req('/api/video/createVideo', 'POST', adminToken, {
      title: 'Audit Video Demonstration',
      url: 'audit_video_file.mp4',
      filename: 'audit_video_file.mp4',
      sessionId: testSessionRefId,
      bucketId: testBucketRefId
    });
    check('POST /api/video/createVideo returns 200', r.status === 200);
    testVideoRefId = r.data?.response?.data?.videoRefId;
  }
  {
    const r = await req('/api/video/createVideo', 'POST', adminToken, {
      title: ''
    });
    check('POST /api/video/createVideo without title returns 400', r.status === 400, r.data?.message || r.data?.code);
  }
  if (testVideoRefId) {
    const r = await req(`/api/video/getVideo?videoRefId=${testVideoRefId}`, 'GET', adminToken);
    check('GET /api/video/getVideo returns 200', r.status === 200);

    // Video watch progress
    const progRes = await req('/api/video/createVideoProgress', 'POST', adminToken, {
      videoRefId: testVideoRefId,
      duration: 60,
      percentage: 50,
      status: 0
    });
    check('POST /api/video/createVideoProgress returns 200', progRes.status === 200);

    const getProgRes = await req(`/api/video/getVideoProgress?videoRefId=${testVideoRefId}`, 'GET', adminToken);
    check('GET /api/video/getVideoProgress returns 200', getProgRes.status === 200);
  }

  // 7. Lesson Master
  console.log('\n--- 7. Lesson Master Controller ---');
  let testLessonRefId = null;
  {
    const r = await req('/api/lesson/getAllLessons', 'GET', adminToken);
    check('GET /api/lesson/getAllLessons returns 200', r.status === 200);
  }
  if (testModuleRefId) {
    const r = await req('/api/lesson/createLesson', 'POST', adminToken, {
      moduleRefId: testModuleRefId,
      lessonName: 'Audit Test Lesson',
      description: 'Lesson for audit verification',
      status: 'active'
    });
    check('POST /api/lesson/createLesson returns 200', r.status === 200);
    testLessonRefId = r.data?.response?.data?.lessonRefId;
  }
  if (testLessonRefId) {
    const r = await req(`/api/lesson/getLesson?lessonRefId=${testLessonRefId}`, 'GET', adminToken);
    check('GET /api/lesson/getLesson returns 200', r.status === 200);
  }

  // 8. Lesson Video Mapping & Lesson Notes
  console.log('\n--- 8. Lesson Video Mappings & Notes ---');
  let testMappingRefId = null;
  {
    const r = await req('/api/lesson/getAllLessonVideoMappings', 'GET', adminToken);
    check('GET /api/lesson/getAllLessonVideoMappings returns 200', r.status === 200);
  }
  if (testLessonRefId && testVideoRefId) {
    const r = await req('/api/lesson/createLessonVideoMapping', 'POST', adminToken, {
      lessonRefId: testLessonRefId,
      videoRefId: testVideoRefId,
      status: 1
    });
    check('POST /api/lesson/createLessonVideoMapping returns 200', r.status === 200);
    testMappingRefId = r.data?.response?.data?.lessonVideoMappingRefId;
  }
  {
    const r = await req('/api/lesson/getAllLessonNotes', 'GET', adminToken);
    check('GET /api/lesson/getAllLessonNotes returns 200', r.status === 200);
  }
  {
    const r = await req('/api/lesson/getAllUserLessonMappings', 'GET', adminToken);
    check('GET /api/lesson/getAllUserLessonMappings returns 200', r.status === 200);
  }

  // 9. Question Controller
  console.log('\n--- 9. Question Controller ---');
  {
    const r = await req('/api/question/getAllQuestions', 'GET', adminToken);
    check('GET /api/question/getAllQuestions returns 200', r.status === 200);
  }
  {
    const r = await req('/api/question/getEditorQuestions', 'GET', userToken);
    check('GET /api/question/getEditorQuestions with userToken returns 200', r.status === 200 && Array.isArray(r.data?.response?.data?.row));
  }
  {
    const r = await req('/api/question/getEditorQuestions', 'GET', adminToken);
    check('GET /api/question/getEditorQuestions with adminToken returns 403 Forbidden', r.status === 403);
  }
  {
    const r = await req('/api/question/checkSyntax', 'POST', userToken, {
      code: 'print("Hello from integration audit!")'
    });
    check('POST /api/question/checkSyntax with valid Python returns 200 (valid: true)', r.status === 200 && r.data?.response?.data?.valid === true);
  }
  {
    const r = await req('/api/question/checkSyntax', 'POST', userToken, {
      code: 'def syntax_error('
    });
    check('POST /api/question/checkSyntax with invalid Python returns 200 (valid: false)', r.status === 200 && r.data?.response?.data?.valid === false);
  }

  // 10. Contact Enquiries
  console.log('\n--- 10. Contact Enquiry Controller ---');
  let testEnquiryId = null;
  {
    const r = await req('/api/contact-enquiries', 'POST', null, {
      name: 'Integration Audit Tester',
      email: 'audit.tester@domain.com',
      phone: '9876543210',
      subject: 'Full-Stack Development',
      message: 'Automated audit test enquiry'
    });
    check('POST /api/contact-enquiries returns 200/201', r.status === 200 || r.status === 201);
    testEnquiryId = r.data?.data?.id || r.data?.response?.data?.id;
  }
  {
    const r = await req('/api/admin/contact-enquiries', 'GET', null);
    check('GET /api/admin/contact-enquiries without token returns 401', r.status === 401);
  }
  {
    const r = await req('/api/admin/contact-enquiries', 'GET', adminToken);
    check('GET /api/admin/contact-enquiries with admin token returns 200', r.status === 200);
  }
  if (testEnquiryId) {
    const r = await req(`/api/admin/contact-enquiries/${testEnquiryId}`, 'GET', adminToken);
    check('GET /api/admin/contact-enquiries/:id returns 200', r.status === 200);

    const patchRes = await req(`/api/admin/contact-enquiries/${testEnquiryId}/status`, 'PATCH', adminToken, {
      status: 'contacted',
      notes: 'Audit updated status'
    });
    check('PATCH /api/admin/contact-enquiries/:id/status returns 200', patchRes.status === 200);

    const retryRes = await req(`/api/admin/contact-enquiries/${testEnquiryId}/retry-email`, 'POST', adminToken);
    check('POST /api/admin/contact-enquiries/:id/retry-email returns 200', retryRes.status === 200);
  }

  // Clean up created entities
  console.log('\n--- Cleanup Created Audit Test Entities ---');
  if (testMappingRefId) {
    await req('/api/lesson/deleteLessonVideoMapping', 'POST', adminToken, { lessonVideoMappingRefId: testMappingRefId });
  }
  if (testLessonRefId) {
    await req('/api/lesson/deleteLesson', 'POST', adminToken, { lessonRefId: testLessonRefId });
  }
  if (testVideoRefId) {
    await req('/api/video/deleteVideo', 'POST', adminToken, { videoRefId: testVideoRefId });
  }
  if (testModuleRefId) {
    await req('/api/module/deleteModule', 'POST', adminToken, { moduleRefId: testModuleRefId });
  }
  if (testCourseRefId) {
    await req('/api/course/deleteCourse', 'POST', adminToken, { courseRefId: testCourseRefId });
  }
  if (testSessionRefId) {
    await req('/api/sessionMaster/deleteSession', 'POST', adminToken, { sessionRefId: testSessionRefId });
  }
  if (testBucketRefId) {
    await req('/api/bucketMaster/deleteBucket', 'POST', adminToken, { bucketRefId: testBucketRefId });
  }
  console.log('Cleanup completed successfully.');

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log('\n====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');
  if (failed > 0) {
    process.exit(1);
  }
})();
