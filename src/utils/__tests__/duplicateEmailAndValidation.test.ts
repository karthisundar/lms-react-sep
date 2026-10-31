import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidSafePath,
  validateUserFields,
  validateVideoFields,
  validateBucketFields,
  validateCourseFields,
  validateModuleFields,
  validateLessonFields,
  validateSessionFields,
  validateUserSessionMappingFields,
  validateLessonVideoMappingFields,
  validateLessonNotesFields,
  validateLoginFields,
} from '../formValidation.ts';

test('1. Email Normalization: Trims leading/trailing whitespace and converts to lowercase', () => {
  assert.equal(normalizeEmail('  Ada.Lovelace@EXAMPLE.COM  '), 'ada.lovelace@example.com');
  assert.equal(normalizeEmail('User@Domain.Co.Uk'), 'user@domain.co.uk');
  assert.equal(normalizeEmail(''), '');
  assert.equal(normalizeEmail(null as unknown as string), '');
});

test('2. Email Format Validation: Correctly validates standard RFC email formats and rejects invalid emails', () => {
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('first.last+tag@sub.domain.org'), true);
  assert.equal(isValidEmail('user@123.com'), true);

  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('user@'), false);
  assert.equal(isValidEmail('@domain.com'), false);
  assert.equal(isValidEmail('user@domain'), false);
  assert.equal(isValidEmail('user space@domain.com'), false);
});

test('3. Phone Format Validation: Allows valid international/domestic formats and allows empty string when optional', () => {
  assert.equal(isValidPhone(''), true); // optional
  assert.equal(isValidPhone('+1 234 567 8900'), true);
  assert.equal(isValidPhone('+44 20 7946 0958'), true);
  assert.equal(isValidPhone('9876543210'), true);
  assert.equal(isValidPhone('(555) 123-4567'), true);

  assert.equal(isValidPhone('abc-def-ghij'), false);
  assert.equal(isValidPhone('123'), false); // too short
});

test('4. URL Validation: Validates HTTP and HTTPS endpoints and rejects malformed URLs', () => {
  assert.equal(isValidUrl('https://cdn.example.com'), true);
  assert.equal(isValidUrl('http://localhost:3100/videos/demo.mp4'), true);
  assert.equal(isValidUrl('https://s3.eu-west-2.amazonaws.com/my-bucket/video.mp4'), true);

  assert.equal(isValidUrl(''), false);
  assert.equal(isValidUrl('not-a-url'), false);
  assert.equal(isValidUrl('ftp://example.com'), false);
});

test('5. Safe Path Validation: Rejects path traversal and null bytes', () => {
  assert.equal(isValidSafePath('lesson-01.mp4'), true);
  assert.equal(isValidSafePath('videos/full-stack/module-01/lesson-01.mp4'), true);

  assert.equal(isValidSafePath('../secret.txt'), false);
  assert.equal(isValidSafePath('..\\secret.txt'), false);
  assert.equal(isValidSafePath('videos/../../etc/passwd'), false);
  assert.equal(isValidSafePath(''), false);
});

test('6. User Form Validation: Enforces required fields, password length, and duplicate email prevention', () => {
  const existingUsers = [
    { id: '1', user_ref_id: 'ref-1', email: 'alice@example.com' },
    { id: '2', user_ref_id: 'ref-2', email: 'bob@example.com' },
  ];

  // Missing fields on create
  const emptyCreate = validateUserFields(
    { name: '', email: '', password: '' },
    'create',
    existingUsers
  );
  assert.ok(emptyCreate.name);
  assert.ok(emptyCreate.email);
  assert.ok(emptyCreate.password);

  // Short password on create (< 6 chars)
  const shortPass = validateUserFields(
    { name: 'John Doe', email: 'john@example.com', password: '123' },
    'create',
    existingUsers
  );
  assert.ok(shortPass.password);
  assert.ok(shortPass.password.includes('6 characters'));

  // Duplicate email detection (case-insensitive) on create
  const dupCreate = validateUserFields(
    { name: 'Alice Clone', email: 'ALICE@EXAMPLE.COM', password: 'Password123!' },
    'create',
    existingUsers
  );
  assert.equal(dupCreate.email, 'This email address is already registered.');

  // Edit user: keeping own email is allowed
  const editSelf = validateUserFields(
    { user_ref_id: 'ref-1', name: 'Alice Renamed', email: 'Alice@example.com' },
    'edit',
    existingUsers
  );
  assert.equal(editSelf.email, undefined);

  // Edit user: attempting to use another user's email is blocked
  const editConflict = validateUserFields(
    { user_ref_id: 'ref-1', name: 'Alice', email: 'bob@example.com' },
    'edit',
    existingUsers
  );
  assert.equal(editConflict.email, 'This email address is already registered.');
});

test('7. Video Form Validation: Enforces title, filename/relative key, session, and bucket', () => {
  const invalidVideo = validateVideoFields({
    title: '',
    filename: '',
    url: '',
    sessionId: '',
    bucketId: '',
  });
  assert.ok(invalidVideo.title);
  assert.ok(invalidVideo.filename);
  assert.ok(invalidVideo.sessionId);
  assert.ok(invalidVideo.bucketId);

  // Path traversal in filename/key is rejected
  const traversalVideo = validateVideoFields({
    title: 'Valid Title',
    filename: '../../hacked.mp4',
    url: '../../hacked.mp4',
    sessionId: 'session-123',
    bucketId: 'bucket-123',
  });
  assert.ok(traversalVideo.filename);
  assert.ok(traversalVideo.filename.includes('Path traversal'));

  // Valid relative key video
  const validVideo = validateVideoFields({
    title: 'Intro Recording',
    filename: 'intro.mp4',
    url: 'videos/intro.mp4',
    sessionId: 'session-123',
    bucketId: 'bucket-123',
  });
  assert.equal(Object.keys(validVideo).length, 0);
});

test('8. Bucket Form Validation: Enforces bucketName and valid serviceUrl', () => {
  const invalid = validateBucketFields({ bucketName: 'A', serviceUrl: 'invalid-url' });
  assert.ok(invalid.bucketName);
  assert.ok(invalid.serviceUrl);

  const valid = validateBucketFields({
    bucketName: 'production-videos',
    serviceUrl: 'https://cdn.example.com',
  });
  assert.equal(Object.keys(valid).length, 0);
});

test('9. Course, Module, Lesson, Session, and Mapping Form Validation', () => {
  // Course validation
  assert.ok(validateCourseFields({ courseName: '' }).courseName);
  assert.equal(Object.keys(validateCourseFields({ courseName: 'Full Stack Web Dev' })).length, 0);

  // Module validation
  assert.ok(validateModuleFields({ moduleName: '', courseId: '' }).courseId);
  assert.ok(validateModuleFields({ moduleName: 'React Basics', courseId: 'c-1', displayOrder: -1 }).displayOrder);
  assert.equal(Object.keys(validateModuleFields({ moduleName: 'React Basics', courseId: 'c-1', displayOrder: 1 })).length, 0);

  // Lesson validation
  assert.ok(validateLessonFields({ lessonName: '', moduleId: '' }).moduleId);
  assert.equal(Object.keys(validateLessonFields({ lessonName: 'Hooks Overview', moduleId: 'm-1', displayOrder: 2 })).length, 0);

  // Session validation
  assert.ok(validateSessionFields({ sessionName: '' }).sessionName);
  assert.ok(validateSessionFields({ sessionName: 'Session 1', date: 'invalid-date' }).date);
  assert.equal(Object.keys(validateSessionFields({ sessionName: 'Session 1', date: '2026-10-24' })).length, 0);

  // Mappings validation
  assert.ok(validateUserSessionMappingFields({ userId: '', sessionId: '' }).userId);
  assert.equal(Object.keys(validateUserSessionMappingFields({ userId: 'u-1', sessionId: 's-1' })).length, 0);

  assert.ok(validateLessonVideoMappingFields({ lessonId: '', videoId: '', displayOrder: 'bad' }).lessonId);
  assert.equal(Object.keys(validateLessonVideoMappingFields({ lessonId: 'l-1', videoId: 'v-1', displayOrder: 1 })).length, 0);
});

test('10. Lesson Notes and Login Validation', () => {
  // Lesson Notes validation
  const emptyNote = validateLessonNotesFields({ lessonId: '', title: '' });
  assert.ok(emptyNote.lessonId);
  assert.ok(emptyNote.title);
  assert.ok(emptyNote.file);

  // Login validation
  const emptyLogin = validateLoginFields({ email: '', password: '' });
  assert.ok(emptyLogin.email);
  assert.ok(emptyLogin.password);

  const invalidEmailLogin = validateLoginFields({ email: 'bad-email', password: 'secret' });
  assert.ok(invalidEmailLogin.email);

  const validLogin = validateLoginFields({ email: 'user@example.com', password: 'secret' });
  assert.equal(Object.keys(validLogin).length, 0);
});
