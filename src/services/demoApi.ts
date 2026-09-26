// Demo-mode data layer used when VITE_API_BASE_URL is empty.
// Returns the same shapes the real REST API would, so the UI is identical.
// When a backend URL is configured, the real api.ts service is used instead.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketUpdateInput,
  Course,
  Lesson,
  LessonNotes,
  LessonVideoMapping,
  Module,
  PaginatedResponse,
  Session,
  User,
  UserCreateInput,
  UserLessonMapping,
  UserSessionMapping,
  UserUpdateInput,
  Video,
  VideoProgress,
  VideoProgressCreateInput,
} from '@/types/api';
import { getStoredUser, getToken, getUserFromToken } from './api';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const demoVideoProgressStore = new Map<string, VideoProgress>();

const admin: User = {
  id: 'u-admin',
  user_id: 1,
  user_ref_id: 'ref-admin-001',
  name: 'Ada Admin',
  email: 'admin@codeclass.dev',
  role: 'admin',
  avatarUrl: '',
  is_active: true,
  createdAt: '2025-01-12T09:00:00Z',
  phoneNumber: '9876543210',
};

const student: User = {
  id: 'u-student',
  user_id: 2,
  user_ref_id: 'ref-student-002',
  name: 'Sam Student',
  email: 'student@codeclass.dev',
  role: 'user',
  avatarUrl: '',
  is_active: true,
  createdAt: '2025-02-03T14:30:00Z',
  phoneNumber: '9123456780',
};

const inactiveUser: User = {
  id: 'u-inactive',
  user_id: 3,
  user_ref_id: 'ref-inactive-003',
  name: 'Ian Inactive',
  email: 'ian@codeclass.dev',
  role: 'user',
  avatarUrl: '',
  is_active: false,
  createdAt: '2025-03-01T11:20:00Z',
  phoneNumber: '9000000000',
};

const sessions: Session[] = [
  {
    sessionMasterId: 1,
    sessionRefId: 'uuid-session-1',
    sessionCode: 'SES-001',
    sessionName: 'Intro to TypeScript',
    description: 'Types, interfaces, and generics from the ground up.',
    startDate: '2026-08-01T10:00:00Z',
    endDate: null,
    status: 'published',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-session-1',
    name: 'Intro to TypeScript',
    date: '2026-08-01T10:00:00Z',
  },
  {
    sessionMasterId: 2,
    sessionRefId: 'uuid-session-2',
    sessionCode: 'SES-002',
    sessionName: 'React Hooks Deep Dive',
    description: 'useState, useEffect, useReducer, and custom hooks.',
    startDate: '2026-08-08T10:00:00Z',
    endDate: null,
    status: 'published',
    createdAt: '2026-08-08T00:00:00Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-session-2',
    name: 'React Hooks Deep Dive',
    date: '2026-08-08T10:00:00Z',
  },
  {
    sessionMasterId: 3,
    sessionRefId: 'uuid-session-3',
    sessionCode: 'SES-003',
    sessionName: 'Supabase + Postgres RLS',
    description: 'Row-level security patterns for multi-tenant apps.',
    startDate: '2026-08-15T10:00:00Z',
    endDate: null,
    status: 'active',
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-session-3',
    name: 'Supabase + Postgres RLS',
    date: '2026-08-15T10:00:00Z',
  },
  {
    sessionMasterId: 4,
    sessionRefId: 'uuid-session-4',
    sessionCode: 'SES-004',
    sessionName: 'Edge Functions with Deno',
    description: 'Deploy serverless functions on Supabase.',
    startDate: '2026-08-22T10:00:00Z',
    endDate: null,
    status: 'draft',
    createdAt: '2026-08-22T00:00:00Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-session-4',
    name: 'Edge Functions with Deno',
    date: '2026-08-22T10:00:00Z',
  },
];

const buckets: Bucket[] = [
  {
    bucketId: 1,
    bucketRefId: 'uuid-bucket-1',
    bucketName: 'recordings-primary',
    serviceUrl: 'https://s3.amazonaws.com/codeclass-recordings/primary',
    status: 1,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    deletedAt: null,
    id: 'b1',
    name: 'recordings-primary',
    provider: 's3',
    url: 's3://codeclass-recordings/primary',
    config: { region: 'us-east-1' },
  },
  {
    bucketId: 2,
    bucketRefId: 'uuid-bucket-2',
    bucketName: 'archive-cold',
    serviceUrl: 'https://storage.googleapis.com/codeclass-archive/cold',
    status: 1,
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z',
    deletedAt: null,
    id: 'b2',
    name: 'archive-cold',
    provider: 'gcs',
    url: 'gs://codeclass-archive/cold',
    config: { storageClass: 'NEARLINE' },
  },
];

const videos: Video[] = [
  {
    videoId: 1,
    videoRefId: 'uuid-video-1',
    title: 'Intro to TypeScript — Full Recording',
    filename: 'intro-ts.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSec: 596,
    sessionId: 'uuid-session-1',
    bucketId: 'uuid-bucket-1',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-video-1',
  },
  {
    videoId: 2,
    videoRefId: 'uuid-video-2',
    title: 'React Hooks Deep Dive — Full Recording',
    filename: 'react-hooks.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSec: 653,
    sessionId: 'uuid-session-2',
    bucketId: 'uuid-bucket-1',
    createdAt: '2026-08-08T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-video-2',
  },
  {
    videoId: 3,
    videoRefId: 'uuid-video-3',
    title: 'Supabase RLS — Full Recording',
    filename: 'supabase-rls.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 15,
    sessionId: 'uuid-session-3',
    bucketId: 'uuid-bucket-2',
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-video-3',
  },
  {
    videoId: 4,
    videoRefId: 'db642430-54f5-4a1a-adbe-eaf9cc0e78c6',
    title: 'Trailer',
    filename: 'Trailer',
    url: 'https://www.youtube.com/watch?v=lU40CPN7Ww0',
    signedUrl: 'https://www.youtube.com/watch?v=lU40CPN7Ww0',
    durationSec: 120,
    sessionId: 'uuid-session-1',
    bucketId: 'uuid-bucket-1',
    createdAt: '2026-09-14T14:41:21.000Z',
    updatedAt: '2026-09-14T14:41:21.000Z',
    deletedAt: null,
    id: 'db642430-54f5-4a1a-adbe-eaf9cc0e78c6',
  },
];

const mappings: UserSessionMapping[] = [
  {
    userSessionId: 1,
    userSessionRefId: 'uuid-mapping-1',
    id: 'uuid-mapping-1',
    userId: 2,
    sessionId: 'uuid-session-1',
    status: 1,
    createdAt: '2026-08-01T12:00:00.000Z',
    user: { id: 'u-student', name: student.name, email: student.email, user_id: student.user_id },
    session: { id: 'uuid-session-1', name: sessions[0].name, date: sessions[0].date, sessionRefId: 'uuid-session-1', sessionName: sessions[0].sessionName },
  },
  {
    userSessionId: 2,
    userSessionRefId: 'uuid-mapping-2',
    id: 'uuid-mapping-2',
    userId: 2,
    sessionId: 'uuid-session-2',
    status: 1,
    createdAt: '2026-08-08T12:00:00.000Z',
    user: { id: 'u-student', name: student.name, email: student.email, user_id: student.user_id },
    session: { id: 'uuid-session-2', name: sessions[1].name, date: sessions[1].date, sessionRefId: 'uuid-session-2', sessionName: sessions[1].sessionName },
  },
];

const users: User[] = [admin, student, inactiveUser];

const courses: Course[] = [
  {
    courseId: 1,
    courseRefId: 'uuid-course-1',
    courseCode: 'CRS-101',
    courseName: 'Node JS Fundamentals',
    description: 'Complete Node.js fundamentals with Express and backend architecture.',
    status: 'published',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-course-1',
    name: 'Node JS Fundamentals',
  },
  {
    courseId: 2,
    courseRefId: 'uuid-course-2',
    courseCode: 'CRS-102',
    courseName: 'React & TypeScript Mastery',
    description: 'Modern frontend development using React 18, TypeScript, and TailwindCSS.',
    status: 'published',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-10T11:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-course-2',
    name: 'React & TypeScript Mastery',
  },
  {
    courseId: 3,
    courseRefId: 'uuid-course-3',
    courseCode: 'CRS-103',
    courseName: 'Fullstack Next.js Application Architecture',
    description: 'Production-ready fullstack web applications with App Router and server actions.',
    status: 'draft',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-20T14:30:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-course-3',
    name: 'Fullstack Next.js Application Architecture',
  },
];

const modules: Module[] = [
  {
    moduleId: 1,
    moduleRefId: 'uuid-module-1',
    courseRefId: 'uuid-course-1',
    courseName: 'Node JS Fundamentals',
    moduleCode: 'MOD-101',
    moduleName: 'Node Runtime & Asynchronous JavaScript',
    description: 'Event loop, callbacks, promises, and the async/await paradigm in Node.js.',
    displayOrder: 1,
    status: 'published',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-module-1',
    name: 'Node Runtime & Asynchronous JavaScript',
  },
  {
    moduleId: 2,
    moduleRefId: 'uuid-module-2',
    courseRefId: 'uuid-course-1',
    courseName: 'Node JS Fundamentals',
    moduleCode: 'MOD-102',
    moduleName: 'Building RESTful APIs with Express',
    description: 'Routing, middleware, error handling, and request validation in Express.',
    displayOrder: 2,
    status: 'published',
    createdAt: '2026-08-04T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-module-2',
    name: 'Building RESTful APIs with Express',
  },
  {
    moduleId: 3,
    moduleRefId: 'uuid-module-3',
    courseRefId: 'uuid-course-2',
    courseName: 'React & TypeScript Mastery',
    moduleCode: 'MOD-201',
    moduleName: 'Component Lifecycle & Advanced Hooks',
    description: 'Deep dive into useEffect, useCallback, useMemo, and custom hooks.',
    displayOrder: 1,
    status: 'published',
    createdAt: '2026-08-12T09:30:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-module-3',
    name: 'Component Lifecycle & Advanced Hooks',
  },
  {
    moduleId: 4,
    moduleRefId: 'uuid-module-4',
    courseRefId: 'uuid-course-2',
    courseName: 'React & TypeScript Mastery',
    moduleCode: 'MOD-202',
    moduleName: 'State Management & Performance Optimization',
    description: 'Context API, memoization techniques, and rendering performance.',
    displayOrder: 2,
    status: 'draft',
    createdAt: '2026-08-15T15:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-module-4',
    name: 'State Management & Performance Optimization',
  },
];

const lessons: Lesson[] = [
  {
    lessonId: 1,
    lessonRefId: 'uuid-lesson-1',
    moduleRefId: 'uuid-module-1',
    moduleName: 'Node Runtime & Asynchronous JavaScript',
    lessonCode: 'LSN-101',
    lessonName: 'Introduction to Node.js Architecture',
    description: 'Learn the core V8 engine and libuv event loop architecture in Node.js.',
    videoRefId: 'uuid-video-1',
    videoTitle: 'Intro to TypeScript — Full Recording',
    notes: 'Read the official Node.js documentation on the event loop and thread pool.',
    displayOrder: 1,
    status: 'published',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lesson-1',
    name: 'Introduction to Node.js Architecture',
  },
  {
    lessonId: 2,
    lessonRefId: 'uuid-lesson-2',
    moduleRefId: 'uuid-module-1',
    moduleName: 'Node Runtime & Asynchronous JavaScript',
    lessonCode: 'LSN-102',
    lessonName: 'Asynchronous Programming with Async/Await',
    description: 'Mastering promises, async/await, and error handling patterns in asynchronous code.',
    videoRefId: 'uuid-video-2',
    videoTitle: 'React Hooks Deep Dive — Full Recording',
    notes: 'Practice transforming callback-based code into modern async/await syntax.',
    displayOrder: 2,
    status: 'published',
    createdAt: '2026-08-05T14:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lesson-2',
    name: 'Asynchronous Programming with Async/Await',
  },
  {
    lessonId: 3,
    lessonRefId: 'uuid-lesson-3',
    moduleRefId: 'uuid-module-2',
    moduleName: 'Building RESTful APIs with Express',
    lessonCode: 'LSN-201',
    lessonName: 'Express Middleware & Request Lifecycle',
    description: 'Deep dive into middleware chains, next(), and custom error handlers.',
    videoRefId: 'uuid-video-3',
    videoTitle: 'Supabase RLS — Full Recording',
    notes: 'Review middleware execution order and write custom request timing middleware.',
    displayOrder: 1,
    status: 'published',
    createdAt: '2026-08-07T11:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lesson-3',
    name: 'Express Middleware & Request Lifecycle',
  },
  {
    lessonId: 4,
    lessonRefId: 'uuid-lesson-4',
    moduleRefId: 'uuid-module-3',
    moduleName: 'Component Lifecycle & Advanced Hooks',
    lessonCode: 'LSN-301',
    lessonName: 'Custom Hooks Architecture & Clean Code',
    description: 'Extracting reusable stateful logic into custom React hooks.',
    videoRefId: null,
    videoTitle: undefined,
    notes: 'Create custom useDebounce and useLocalStorage hooks.',
    displayOrder: 1,
    status: 'draft',
    createdAt: '2026-08-14T16:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lesson-4',
    name: 'Custom Hooks Architecture & Clean Code',
  },
];

const lessonVideoMappings: LessonVideoMapping[] = [
  {
    lessonVideoMappingId: 1,
    lessonVideoMappingRefId: 'uuid-lvm-1',
    lessonRefId: 'uuid-lesson-1',
    videoRefId: 'uuid-video-1',
    displayOrder: 1,
    status: 'published',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lvm-1',
    lessonName: 'Introduction to Node.js Architecture',
    videoTitle: 'Intro to TypeScript — Full Recording',
  },
  {
    lessonVideoMappingId: 2,
    lessonVideoMappingRefId: 'uuid-lvm-2',
    lessonRefId: 'uuid-lesson-2',
    videoRefId: 'uuid-video-2',
    displayOrder: 1,
    status: 'published',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-06T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lvm-2',
    lessonName: 'Asynchronous Programming with Async/Await',
    videoTitle: 'React Hooks Deep Dive — Full Recording',
  },
  {
    lessonVideoMappingId: 3,
    lessonVideoMappingRefId: 'uuid-lvm-3',
    lessonRefId: 'uuid-lesson-3',
    videoRefId: 'uuid-video-3',
    displayOrder: 1,
    status: 'draft',
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-08T15:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-lvm-3',
    lessonName: 'Express Middleware & Request Lifecycle',
    videoTitle: 'Supabase RLS — Full Recording',
  },
];

const lessonNotes: LessonNotes[] = [
  {
    lessonNotesId: 1,
    lessonNotesRefId: 'uuid-note-1',
    lessonId: 1,
    title: 'Node Architecture Key Notes',
    content: 'The V8 engine compiles JavaScript directly to native machine code. Libuv handles asynchronous I/O and provides the event loop with thread pool support for heavy OS operations.',
    status: 1,
    documentUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    fileName: 'node-architecture-overview.pdf',
    filename: 'node-architecture-overview.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-note-1',
    lessonName: 'Introduction to Node.js Architecture',
  },
  {
    lessonNotesId: 2,
    lessonNotesRefId: 'uuid-note-2',
    lessonId: 2,
    title: 'Async/Await Best Practices',
    content: 'Always wrap asynchronous calls in try/catch blocks or use a higher-order wrapper function to propagate errors to express error middleware cleanly.',
    status: 1,
    documentUrl: 'https://raw.githubusercontent.com/SheetJS/sheetjs/master/test_files/sheetjs.xlsx',
    fileName: 'async-await-cheatsheet.xlsx',
    filename: 'async-await-cheatsheet.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 42560,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-06T12:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-note-2',
    lessonName: 'Asynchronous Programming with Async/Await',
  },
  {
    lessonNotesId: 3,
    lessonNotesRefId: 'uuid-note-3',
    lessonId: 3,
    title: 'Middleware Ordering Rules',
    content: 'Middleware functions execute in the order they are mounted with app.use(). Error handlers must accept 4 arguments: (err, req, res, next).',
    status: 1,
    documentUrl: null,
    fileName: null,
    filename: null,
    fileType: null,
    fileSize: null,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-08T15:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-note-3',
    lessonName: 'Express Middleware & Request Lifecycle',
  },
];


const userLessonMappings: UserLessonMapping[] = [
  {
    userLessonId: 1,
    userLessonRefId: 'uuid-ulm-1',
    userId: 2,
    lessonId: 1,
    status: 1,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-ulm-1',
    userName: student.name,
    userEmail: student.email,
    lessonName: 'Introduction to Node.js Architecture',
    user: { id: student.id, name: student.name, email: student.email, user_id: student.user_id },
  },
  {
    userLessonId: 2,
    userLessonRefId: 'uuid-ulm-2',
    userId: 2,
    lessonId: 2,
    status: 1,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-07T11:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-ulm-2',
    userName: student.name,
    userEmail: student.email,
    lessonName: 'Asynchronous Programming with Async/Await',
    user: { id: student.id, name: student.name, email: student.email, user_id: student.user_id },
  },
  {
    userLessonId: 3,
    userLessonRefId: 'uuid-ulm-3',
    userId: 3,
    lessonId: 3,
    status: 0,
    createdBy: 1,
    updatedBy: null,
    deletedBy: null,
    createdAt: '2026-08-09T14:00:00.000Z',
    updatedAt: null,
    deletedAt: null,
    id: 'uuid-ulm-3',
    userName: inactiveUser.name,
    userEmail: inactiveUser.email,
    lessonName: 'Express Middleware & Request Lifecycle',
    user: { id: inactiveUser.id, name: inactiveUser.name, email: inactiveUser.email, user_id: inactiveUser.user_id },
  },
];






function paginate<T>(items: T[], search: string | undefined, page = 1, pageSize = 10): PaginatedResponse<T> {
  const filtered = search
    ? items.filter((i) => JSON.stringify(i).toLowerCase().includes(search.toLowerCase()))
    : items;
  const start = (page - 1) * pageSize;
  const row = filtered.slice(start, start + pageSize);
  return {
    totalItem: filtered.length,
    totalPage: Math.max(1, Math.ceil(filtered.length / pageSize)),
    row,
    currentPage: String(page),
    items: row,
    total: filtered.length,
    page,
    pageSize,
  };
}

export const demoApi = {
  async login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
    await delay();
    const u = users.find((x) => x.email.toLowerCase() === body.email.toLowerCase());
    const validPassword =
      u &&
      (body.password === 'password' ||
        (u.password && (u.password === btoa(body.password) || u.password === body.password)));
    if (!u || !validPassword) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }
    if (!u.is_active) {
      throw Object.assign(new Error('Account is inactive. Please contact your administrator.'), { status: 403 });
    }
    return { token: `demo.${u.role}.${u.id}`, user: u };
  },

  async me(): Promise<User> {
    await delay(100);
    return student;
  },

  async profile(): Promise<User> {
    await delay(100);
    return student;
  },

  async mySessions(params: { search?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<Session>> {
    await delay();
    const mine = sessions.filter((s) =>
      mappings.some(
        (m) =>
          (String(m.userId) === 'u-student' || String(m.userId) === '2' || m.user?.id === 'u-student') &&
          (m.sessionId === s.id || m.sessionId === s.sessionRefId)
      )
    );
    return paginate(mine, params.search, params.page, params.pageSize);
  },

  async session(id: string): Promise<Session> {
    await delay();
    const s = sessions.find((x) => x.id === id);
    if (!s) throw Object.assign(new Error('Session not found'), { status: 404 });
    return s;
  },

  async videoForSession(sessionId: string): Promise<Video> {
    await delay();
    const v = videos.find((x) => x.sessionId === sessionId || x.sessionId === `uuid-${sessionId}`);
    if (!v) throw Object.assign(new Error('No video for this session'), { status: 404 });
    return { ...v, signedUrl: v.url };
  },

  sessions: {
    async list(params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = sessions;
      if (params.status && params.status !== 'all') {
        list = list.filter((s) => s.status.toLowerCase() === params.status?.toLowerCase());
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const s = sessions.find((x) => x.sessionRefId === refOrId || x.id === refOrId);
      if (!s) throw Object.assign(new Error('Session not found'), { status: 404 });
      return s;
    },
    async create(body: any) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can create sessions'), { status: 403 });
      }

      const refId = body.sessionRefId && String(body.sessionRefId).trim() ? body.sessionRefId : `uuid-${Date.now()}`;
      const existingIdx = sessions.findIndex((x) => x.sessionRefId === body.sessionRefId || x.id === body.sessionRefId);
      if (existingIdx >= 0) {
        sessions[existingIdx] = {
          ...sessions[existingIdx],
          sessionName: body.name ?? body.sessionName ?? sessions[existingIdx].sessionName,
          name: body.name ?? body.sessionName ?? sessions[existingIdx].name,
          description: body.description !== undefined ? body.description : sessions[existingIdx].description,
          startDate: body.date ?? body.startDate ?? sessions[existingIdx].startDate,
          date: body.date ?? body.startDate ?? sessions[existingIdx].date,
          status: body.status ?? sessions[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return sessions[existingIdx];
      }
      const newId = sessions.length + 1;
      const sName = body.name ?? body.sessionName ?? '';
      const sDate = body.date ?? body.startDate ?? '';
      const s: Session = {
        sessionMasterId: newId,
        sessionRefId: refId,
        sessionCode: `SES-${String(newId).padStart(3, '0')}`,
        sessionName: sName,
        description: body.description ?? null,
        startDate: sDate || null,
        endDate: null,
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
        name: sName,
        date: sDate,
      };
      sessions.unshift(s);
      return s;
    },
    async update(id: string, body: any) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can modify sessions'), { status: 403 });
      }

      const idx = sessions.findIndex((x) => x.sessionRefId === id || x.id === id);
      if (idx >= 0) {
        sessions[idx] = {
          ...sessions[idx],
          sessionName: body.name ?? body.sessionName ?? sessions[idx].sessionName,
          name: body.name ?? body.sessionName ?? sessions[idx].name,
          description: body.description !== undefined ? body.description : sessions[idx].description,
          startDate: body.date ?? body.startDate ?? sessions[idx].startDate,
          date: body.date ?? body.startDate ?? sessions[idx].date,
          status: body.status ?? sessions[idx].status,
          updatedAt: new Date().toISOString(),
        };
        return sessions[idx];
      }
      throw Object.assign(new Error('Session not found'), { status: 404 });
    },
    async remove(id: string) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can delete sessions'), { status: 403 });
      }

      const i = sessions.findIndex((x) => x.sessionRefId === id || x.id === id);
      if (i >= 0) sessions.splice(i, 1);
    },
  },

  buckets: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(buckets, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const b = buckets.find((x) => x.bucketRefId === refOrId || x.id === refOrId);
      if (!b) throw Object.assign(new Error('Bucket not found'), { status: 404 });
      return b;
    },
    async create(body: any) {
      const bPayload = body as any;
      await delay();
      const refId = bPayload.bucketRefId && bPayload.bucketRefId.trim() ? bPayload.bucketRefId : `uuid-${Date.now()}`;
      const existingIdx = buckets.findIndex((x) => x.bucketRefId === bPayload.bucketRefId || x.id === bPayload.bucketRefId);
      if (existingIdx >= 0) {
        buckets[existingIdx] = {
          ...buckets[existingIdx],
          ...body,
          bucketName: body.bucketName ?? buckets[existingIdx].bucketName,
          name: body.bucketName ?? buckets[existingIdx].name,
          serviceUrl: body.serviceUrl ?? buckets[existingIdx].serviceUrl,
          url: body.serviceUrl ?? buckets[existingIdx].url,
          status: body.status !== undefined ? Number(body.status) : buckets[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return buckets[existingIdx];
      }
      const newId = buckets.length + 1;
      const b: Bucket = {
        bucketId: newId,
        bucketRefId: refId,
        bucketName: body.bucketName ?? body.name ?? '',
        serviceUrl: body.serviceUrl ?? body.url ?? '',
        status: body.status !== undefined ? Number(body.status) : 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        id: `b${newId}`,
        name: body.bucketName ?? body.name ?? '',
        url: body.serviceUrl ?? body.url ?? '',
        provider: body.provider ?? 'other',
        config: body.config ?? null,
      };
      buckets.unshift(b);
      return b;
    },
    async update(id: string, body: Partial<Bucket>) {
      await delay();
      const idx = buckets.findIndex((x) => x.bucketRefId === id || x.id === id);
      if (idx >= 0) {
        buckets[idx] = {
          ...buckets[idx],
          ...body,
          bucketName: body.bucketName ?? buckets[idx].bucketName,
          name: body.bucketName ?? buckets[idx].name,
          serviceUrl: body.serviceUrl ?? buckets[idx].serviceUrl,
          url: body.serviceUrl ?? buckets[idx].url,
          status: body.status !== undefined ? Number(body.status) : buckets[idx].status,
          updatedAt: new Date().toISOString(),
        };
        return buckets[idx];
      }
      throw Object.assign(new Error('Bucket not found'), { status: 404 });
    },
    async remove(id: string) {
      await delay();
      const i = buckets.findIndex((x) => x.bucketRefId === id || x.id === id);
      if (i >= 0) buckets.splice(i, 1);
    },
  },

  videos: {
    async list(params: { search?: string; sessionId?: string; sessionRefId?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = videos;
      const targetSession = params.sessionId || params.sessionRefId;
      if (targetSession) {
        list = list.filter((v) => v.sessionId === targetSession || (v as any).sessionRefId === targetSession);
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const v = videos.find((x) => x.videoRefId === refOrId || x.id === refOrId);
      if (!v) throw Object.assign(new Error('Video not found'), { status: 404 });
      return v;
    },
    async create(body: any) {
      await delay();
      const refId = body.videoRefId && String(body.videoRefId).trim() ? body.videoRefId : `uuid-${Date.now()}`;
      const existingIdx = videos.findIndex((x) => x.videoRefId === body.videoRefId || x.id === body.videoRefId);
      if (existingIdx >= 0) {
        videos[existingIdx] = {
          ...videos[existingIdx],
          title: body.title ?? videos[existingIdx].title,
          filename: body.filename ?? videos[existingIdx].filename,
          url: body.url ?? videos[existingIdx].url,
          sessionId: body.sessionId ?? videos[existingIdx].sessionId,
          bucketId: body.bucketId ?? videos[existingIdx].bucketId,
          updatedAt: new Date().toISOString(),
        };
        return videos[existingIdx];
      }
      const newId = videos.length + 1;
      const v: Video = {
        videoId: newId,
        videoRefId: refId,
        title: body.title ?? '',
        filename: body.filename ?? '',
        url: body.url ?? '',
        sessionId: body.sessionId ?? '',
        bucketId: body.bucketId ?? '',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
        signedUrl: body.url ?? '',
      };
      videos.unshift(v);
      return v;
    },
    async update(id: string, body: any) {
      await delay();
      const idx = videos.findIndex((x) => x.videoRefId === id || x.id === id);
      if (idx >= 0) {
        videos[idx] = {
          ...videos[idx],
          title: body.title ?? videos[idx].title,
          filename: body.filename ?? videos[idx].filename,
          url: body.url ?? videos[idx].url,
          sessionId: body.sessionId ?? videos[idx].sessionId,
          bucketId: body.bucketId ?? videos[idx].bucketId,
          updatedAt: new Date().toISOString(),
        };
        return videos[idx];
      }
      throw Object.assign(new Error('Video not found'), { status: 404 });
    },
    async remove(id: string) {
      await delay();
      const i = videos.findIndex((x) => x.videoRefId === id || x.id === id);
      if (i >= 0) videos.splice(i, 1);
    },
    async getVideoProgress(videoRefId: string): Promise<VideoProgress | null> {
      await delay(50);
      return demoVideoProgressStore.get(videoRefId) || null;
    },
    async createVideoProgress(payload: VideoProgressCreateInput): Promise<void> {
      await delay(50);
      demoVideoProgressStore.set(payload.videoRefId, {
        videoRefId: payload.videoRefId,
        lastWatchedDuration: payload.lastWatchedDuration,
        videoDuration: payload.videoDuration,
        isCompleted: typeof payload.isCompleted === 'boolean'
          ? payload.isCompleted
          : payload.lastWatchedDuration >= payload.videoDuration && payload.videoDuration > 0,
      });
    },
  },

  mappings: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      let list = mappings;
      if (currentUser && currentUser.role !== 'admin') {
        list = mappings.filter(
          (m) =>
            String(m.userId) === String(currentUser.user_id) ||
            String(m.userId) === String(currentUser.id) ||
            m.user?.id === currentUser.id
        );
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const m = mappings.find(
        (x) => x.userSessionRefId === refOrId || x.id === refOrId || String(x.userSessionId) === refOrId
      );
      if (!m) throw Object.assign(new Error('User session mapping not found'), { status: 404 });
      return m;
    },
    async create(body: any) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can assign or create user session mappings'), { status: 403 });
      }

      const refId =
        body.userSessionRefId && String(body.userSessionRefId).trim()
          ? body.userSessionRefId
          : `uuid-mapping-${Date.now()}`;
      const existingIdx = mappings.findIndex(
        (x) => x.userSessionRefId === body.userSessionRefId || x.id === body.userSessionRefId
      );
      const u = users.find(
        (x) => String(x.user_id) === String(body.userId) || x.id === String(body.userId) || x.user_ref_id === String(body.userId)
      );
      const s = sessions.find(
        (x) => x.sessionRefId === body.sessionId || x.id === body.sessionId
      );

      if (existingIdx >= 0) {
        mappings[existingIdx] = {
          ...mappings[existingIdx],
          userId: Number(body.userId) || body.userId,
          sessionId: body.sessionId,
          status: body.status !== undefined ? Number(body.status) : mappings[existingIdx].status,
          user: u ? { id: u.id, name: u.name, email: u.email, user_id: u.user_id } : mappings[existingIdx].user,
          session: s ? { id: s.id, name: s.sessionName || s.name, date: s.startDate || s.date, sessionRefId: s.sessionRefId, sessionName: s.sessionName } : mappings[existingIdx].session,
          updatedAt: new Date().toISOString(),
        };
        return mappings[existingIdx];
      }

      const newId = mappings.length + 1;
      const m: UserSessionMapping = {
        userSessionId: newId,
        userSessionRefId: refId,
        id: refId,
        userId: Number(body.userId) || body.userId,
        sessionId: body.sessionId,
        status: body.status !== undefined ? Number(body.status) : 1,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        user: u ? { id: u.id, name: u.name, email: u.email, user_id: u.user_id } : undefined,
        session: s ? { id: s.id, name: s.sessionName || s.name, date: s.startDate || s.date, sessionRefId: s.sessionRefId, sessionName: s.sessionName } : undefined,
      };
      mappings.unshift(m);
      return m;
    },
    async update(id: string, body: any) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can modify user session mappings'), { status: 403 });
      }

      const idx = mappings.findIndex(
        (x) => x.userSessionRefId === id || x.id === id || String(x.userSessionId) === id
      );
      if (idx >= 0) {
        const u = users.find(
          (x) => String(x.user_id) === String(body.userId) || x.id === String(body.userId) || x.user_ref_id === String(body.userId)
        );
        const s = sessions.find(
          (x) => x.sessionRefId === body.sessionId || x.id === body.sessionId
        );
        mappings[idx] = {
          ...mappings[idx],
          userId: body.userId !== undefined ? (Number(body.userId) || body.userId) : mappings[idx].userId,
          sessionId: body.sessionId !== undefined ? body.sessionId : mappings[idx].sessionId,
          status: body.status !== undefined ? Number(body.status) : mappings[idx].status,
          user: u ? { id: u.id, name: u.name, email: u.email, user_id: u.user_id } : mappings[idx].user,
          session: s ? { id: s.id, name: s.sessionName || s.name, date: s.startDate || s.date, sessionRefId: s.sessionRefId, sessionName: s.sessionName } : mappings[idx].session,
          updatedAt: new Date().toISOString(),
        };
        return mappings[idx];
      }
      throw Object.assign(new Error('User session mapping not found'), { status: 404 });
    },
    async remove(refOrId: string) {
      await delay();
      const currentUser = getStoredUser() || (getToken() ? getUserFromToken(getToken()!) : null);
      if (currentUser && currentUser.role !== 'admin') {
        throw Object.assign(new Error('Forbidden: Only administrators can delete user session mappings'), { status: 403 });
      }

      const i = mappings.findIndex(
        (x) => x.userSessionRefId === refOrId || x.id === refOrId || String(x.userSessionId) === refOrId
      );
      if (i >= 0) mappings.splice(i, 1);
    },
  },

  users: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(users, params.search, params.page, params.pageSize);
    },
    async get(id: string) {
      await delay();
      const u = users.find((x) => x.id === id);
      if (!u) throw Object.assign(new Error('User not found'), { status: 404 });
      return u;
    },
    async create(body: UserCreateInput | UserUpdateInput) {
      await delay();
      const refId = body.user_ref_id;
      if (refId && refId !== '') {
        const existingIdx = users.findIndex((x) => x.user_ref_id === refId || x.id === refId);
        if (existingIdx >= 0) {
          return demoApi.users.update(refId, body as UserUpdateInput);
        }
      }
      const email = body.email ? body.email.trim().toLowerCase() : '';
      if (!body.name?.trim()) {
        throw Object.assign(new Error('Name is required'), { status: 400 });
      }
      if (!email) {
        throw Object.assign(new Error('Email is required'), { status: 400 });
      }
      if (!body.password) {
        throw Object.assign(new Error('Password is required'), { status: 400 });
      }
      if (users.some((x) => x.email.toLowerCase() === email)) {
        throw Object.assign(new Error('A user with this email already exists'), { status: 409 });
      }
      const newRef = refId || `ref-${Date.now()}`;
      const u: User = {
        id: `u-${Date.now()}`,
        user_id: users.length + 1,
        user_ref_id: newRef,
        name: body.name.trim(),
        email,
        role: body.role ?? 'user',
        avatarUrl: body.avatarUrl || '',
        password: body.password,
        phoneNumber: body.phoneNumber || body.phone_number || '',
        phone_number: body.phoneNumber || body.phone_number || '',
        is_active: body.is_active !== undefined ? body.is_active : true,
        status: body.is_active === false ? 'inactive' : 'active',
        createdAt: (body as any).createdAt || new Date().toISOString(),
      };
      users.unshift(u);
      return u;
    },
    async update(id: string, body: UserUpdateInput) {
      await delay();
      const idx = users.findIndex((x) => x.user_ref_id === id || x.id === id || String(x.user_id) === id);
      if (idx === -1) throw Object.assign(new Error('User not found'), { status: 404 });
      if (body.email) {
        const email = body.email.trim().toLowerCase();
        if (users.some((x, i) => i !== idx && x.email.toLowerCase() === email)) {
          throw Object.assign(new Error('A user with this email already exists'), { status: 409 });
        }
      }
      const existing = users[idx];
      const phone = body.phoneNumber ?? body.phone_number ?? existing.phoneNumber ?? '';
      const updated: User = {
        ...existing,
        name: body.name !== undefined ? body.name.trim() : existing.name,
        email: body.email !== undefined ? body.email.trim().toLowerCase() : existing.email,
        role: body.role !== undefined ? body.role : existing.role,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : existing.avatarUrl,
        is_active: body.is_active !== undefined ? body.is_active : existing.is_active,
        status: body.is_active !== undefined ? (body.is_active ? 'active' : 'inactive') : existing.status,
        phoneNumber: phone,
        phone_number: phone,
        password: body.password !== undefined && body.password !== '' ? body.password : existing.password,
      };
      users[idx] = updated;
      return users[idx];
    },
    async remove(id: string) {
      await delay();
      const idx = users.findIndex((x) => x.user_ref_id === id || x.id === id || String(x.user_id) === id);
      if (idx === -1) throw Object.assign(new Error('User not found'), { status: 404 });
      users.splice(idx, 1);
    },
    async getUsers(params: { search?: string; page?: number; pageSize?: number } = {}) {
      return demoApi.users.list(params);
    },
    async getUserById(id: string) {
      return demoApi.users.get(id);
    },
    async createUser(body: UserCreateInput | UserUpdateInput) {
      return demoApi.users.create(body);
    },
    async updateUser(id: string, body: UserUpdateInput) {
      return demoApi.users.update(id, body);
    },
    async deleteUser(id: string) {
      return demoApi.users.remove(id);
    },
  },

  courses: {
    async list(params: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = courses;
      if (params.status && params.status !== 'all') {
        list = list.filter((c) => String(c.status).toLowerCase() === params.status?.toLowerCase());
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const c = courses.find((x) => x.courseRefId === refOrId || x.id === refOrId);
      if (!c) throw Object.assign(new Error('Course not found'), { status: 404 });
      return c;
    },
    async create(body: any) {
      await delay();
      const refId = body.courseRefId && String(body.courseRefId).trim() ? body.courseRefId : `uuid-${Date.now()}`;
      const existingIdx = courses.findIndex((x) => x.courseRefId === body.courseRefId || x.id === body.courseRefId);
      if (existingIdx >= 0) {
        courses[existingIdx] = {
          ...courses[existingIdx],
          courseName: body.courseName ?? courses[existingIdx].courseName,
          name: body.courseName ?? courses[existingIdx].courseName,
          description: body.description !== undefined ? body.description : courses[existingIdx].description,
          status: body.status ?? courses[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return courses[existingIdx];
      }
      const newId = courses.length + 1;
      const c: Course = {
        courseId: newId,
        courseRefId: refId,
        courseCode: `CRS-${100 + newId}`,
        courseName: body.courseName ?? '',
        name: body.courseName ?? '',
        description: body.description ?? null,
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      courses.unshift(c);
      return c;
    },
    async remove(refOrId: string) {
      await delay();
      const i = courses.findIndex((x) => x.courseRefId === refOrId || x.id === refOrId);
      if (i >= 0) courses.splice(i, 1);
    },
  },

  modules: {
    async list(params: { search?: string; status?: string; courseRefId?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = modules;
      if (params.courseRefId && params.courseRefId !== 'all') {
        list = list.filter((m) => m.courseRefId === params.courseRefId);
      }
      if (params.status && params.status !== 'all') {
        list = list.filter((m) => String(m.status).toLowerCase() === params.status?.toLowerCase());
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const m = modules.find((x) => x.moduleRefId === refOrId || x.id === refOrId);
      if (!m) throw Object.assign(new Error('Module not found'), { status: 404 });
      return m;
    },
    async create(body: any) {
      await delay();
      const refId = body.moduleRefId && String(body.moduleRefId).trim() ? body.moduleRefId : `uuid-${Date.now()}`;
      const course = courses.find((c) => c.courseRefId === body.courseRefId || c.id === body.courseRefId);
      const existingIdx = modules.findIndex((x) => x.moduleRefId === body.moduleRefId || x.id === body.moduleRefId);
      if (existingIdx >= 0) {
        modules[existingIdx] = {
          ...modules[existingIdx],
          courseRefId: body.courseRefId ?? modules[existingIdx].courseRefId,
          courseName: course ? course.courseName : modules[existingIdx].courseName,
          moduleName: body.moduleName ?? modules[existingIdx].moduleName,
          name: body.moduleName ?? modules[existingIdx].moduleName,
          description: body.description !== undefined ? body.description : modules[existingIdx].description,
          displayOrder: Number(body.displayOrder ?? modules[existingIdx].displayOrder),
          status: body.status ?? modules[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return modules[existingIdx];
      }
      const newId = modules.length + 1;
      const mod: Module = {
        moduleId: newId,
        moduleRefId: refId,
        courseRefId: body.courseRefId ?? '',
        courseName: course ? course.courseName : undefined,
        moduleCode: `MOD-${100 + newId}`,
        moduleName: body.moduleName ?? '',
        name: body.moduleName ?? '',
        description: body.description ?? null,
        displayOrder: Number(body.displayOrder ?? 1),
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      modules.unshift(mod);
      return mod;
    },
    async remove(refOrId: string) {
      await delay();
      const i = modules.findIndex((x) => x.moduleRefId === refOrId || x.id === refOrId);
      if (i >= 0) modules.splice(i, 1);
    },
  },

  lessons: {
    async list(params: { search?: string; status?: string; moduleRefId?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = lessons;
      if (params.moduleRefId && params.moduleRefId !== 'all') {
        list = list.filter((l) => l.moduleRefId === params.moduleRefId);
      }
      if (params.status && params.status !== 'all') {
        list = list.filter((l) => String(l.status).toLowerCase() === params.status?.toLowerCase());
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const l = lessons.find((x) => x.lessonRefId === refOrId || x.id === refOrId);
      if (!l) throw Object.assign(new Error('Lesson not found'), { status: 404 });
      return l;
    },
    async create(body: any) {
      await delay();
      const refId = body.lessonRefId && String(body.lessonRefId).trim() ? body.lessonRefId : `uuid-${Date.now()}`;
      const mod = modules.find((m) => m.moduleRefId === body.moduleRefId || m.id === body.moduleRefId);
      const vid = videos.find((v) => v.videoRefId === body.videoRefId || v.id === body.videoRefId);
      const existingIdx = lessons.findIndex((x) => x.lessonRefId === body.lessonRefId || x.id === body.lessonRefId);
      if (existingIdx >= 0) {
        lessons[existingIdx] = {
          ...lessons[existingIdx],
          moduleRefId: body.moduleRefId ?? lessons[existingIdx].moduleRefId,
          moduleName: mod ? mod.moduleName : lessons[existingIdx].moduleName,
          lessonName: body.lessonName ?? lessons[existingIdx].lessonName,
          name: body.lessonName ?? lessons[existingIdx].lessonName,
          description: body.description !== undefined ? body.description : lessons[existingIdx].description,
          videoRefId: body.videoRefId !== undefined ? (body.videoRefId ? String(body.videoRefId).trim() : null) : lessons[existingIdx].videoRefId,
          videoTitle: vid ? vid.title : (body.videoRefId ? lessons[existingIdx].videoTitle : undefined),
          notes: body.notes !== undefined ? body.notes : lessons[existingIdx].notes,
          displayOrder: Number(body.displayOrder ?? lessons[existingIdx].displayOrder),
          status: body.status ?? lessons[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return lessons[existingIdx];
      }
      const newId = lessons.length + 1;
      const lsn: Lesson = {
        lessonId: newId,
        lessonRefId: refId,
        moduleRefId: body.moduleRefId ?? '',
        moduleName: mod ? mod.moduleName : undefined,
        lessonCode: `LSN-${100 + newId}`,
        lessonName: body.lessonName ?? '',
        name: body.lessonName ?? '',
        description: body.description ?? null,
        videoRefId: body.videoRefId && String(body.videoRefId).trim() ? String(body.videoRefId).trim() : null,
        videoTitle: vid ? vid.title : undefined,
        notes: body.notes ?? null,
        displayOrder: Number(body.displayOrder ?? 1),
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      lessons.unshift(lsn);
      return lsn;
    },
    async remove(refOrId: string) {
      await delay();
      const i = lessons.findIndex((x) => x.lessonRefId === refOrId || x.id === refOrId);
      if (i >= 0) lessons.splice(i, 1);
    },
  },

  lessonVideoMappings: {
    async list(params: { search?: string; status?: string; lessonRefId?: string; videoRefId?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = lessonVideoMappings;
      if (params.lessonRefId && params.lessonRefId !== 'all') {
        list = list.filter((m) => m.lessonRefId === params.lessonRefId);
      }
      if (params.videoRefId && params.videoRefId !== 'all') {
        list = list.filter((m) => m.videoRefId === params.videoRefId);
      }
      if (params.status && params.status !== 'all') {
        list = list.filter((m) => String(m.status).toLowerCase() === params.status?.toLowerCase());
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const item = lessonVideoMappings.find(
        (x) => x.lessonVideoMappingRefId === refOrId || x.id === refOrId
      );
      if (!item) throw Object.assign(new Error('Lesson Video Mapping not found'), { status: 404 });
      return item;
    },
    async create(body: any) {
      await delay();
      const refId =
        body.lessonVideoMappingRefId && String(body.lessonVideoMappingRefId).trim()
          ? body.lessonVideoMappingRefId
          : `uuid-lvm-${Date.now()}`;
      const lsn = lessons.find((l) => l.lessonRefId === body.lessonRefId || l.id === body.lessonRefId);
      const vid = videos.find((v) => v.videoRefId === body.videoRefId || v.id === body.videoRefId);
      const existingIdx = lessonVideoMappings.findIndex(
        (x) => x.lessonVideoMappingRefId === body.lessonVideoMappingRefId || x.id === body.lessonVideoMappingRefId
      );
      if (existingIdx >= 0) {
        lessonVideoMappings[existingIdx] = {
          ...lessonVideoMappings[existingIdx],
          lessonRefId: body.lessonRefId ?? lessonVideoMappings[existingIdx].lessonRefId,
          lessonName: lsn ? lsn.lessonName : lessonVideoMappings[existingIdx].lessonName,
          videoRefId: body.videoRefId ?? lessonVideoMappings[existingIdx].videoRefId,
          videoTitle: vid ? vid.title : lessonVideoMappings[existingIdx].videoTitle,
          displayOrder: Number(body.displayOrder ?? lessonVideoMappings[existingIdx].displayOrder),
          status: body.status ?? lessonVideoMappings[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return lessonVideoMappings[existingIdx];
      }
      const newId = lessonVideoMappings.length + 1;
      const mapping: LessonVideoMapping = {
        lessonVideoMappingId: newId,
        lessonVideoMappingRefId: refId,
        lessonRefId: body.lessonRefId ?? '',
        lessonName: lsn ? lsn.lessonName : undefined,
        videoRefId: body.videoRefId ?? '',
        videoTitle: vid ? vid.title : undefined,
        displayOrder: Number(body.displayOrder ?? 1),
        status: body.status ?? 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      lessonVideoMappings.unshift(mapping);
      return mapping;
    },
    async remove(refOrId: string) {
      await delay();
      const i = lessonVideoMappings.findIndex(
        (x) => x.lessonVideoMappingRefId === refOrId || x.id === refOrId
      );
      if (i >= 0) lessonVideoMappings.splice(i, 1);
    },
  },

  lessonNotes: {
    async list(params: { search?: string; status?: any; lessonId?: any; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = lessonNotes;
      if (params.lessonId !== undefined && params.lessonId !== null && params.lessonId !== 'all') {
        list = list.filter((n) => String(n.lessonId) === String(params.lessonId));
      }
      if (params.status !== undefined && params.status !== null && params.status !== 'all') {
        list = list.filter((n) => String(n.status) === String(params.status));
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const item = lessonNotes.find(
        (x) => x.lessonNotesRefId === refOrId || x.id === refOrId
      );
      if (!item) throw Object.assign(new Error('Lesson Note not found'), { status: 404 });
      return item;
    },
    async create(body: any) {
      await delay();
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      const lessonNotesRefId = isFormData ? (body.get('lessonNotesRefId') as string) : body.lessonNotesRefId;
      const lessonId = isFormData ? (body.get('lessonId') as string) : body.lessonId;
      const title = isFormData ? (body.get('title') as string) : body.title;
      const content = isFormData ? (body.get('content') as string) : body.content;
      const status = isFormData ? Number(body.get('status') ?? 1) : (body.status ?? 1);
      const file = isFormData ? (body.get('file') as File | null) : body.file;

      const refId =
        lessonNotesRefId && String(lessonNotesRefId).trim()
          ? lessonNotesRefId
          : `uuid-note-${Date.now()}`;
      const lsn = lessons.find(
        (l) => String(l.lessonId) === String(lessonId) || l.lessonRefId === String(lessonId) || l.id === String(lessonId)
      );
      const existingIdx = lessonNotes.findIndex(
        (x) => x.lessonNotesRefId === lessonNotesRefId || x.id === lessonNotesRefId
      );

      let docUrl = body.documentUrl;
      let docName = body.fileName || body.filename;
      let docType = body.fileType;
      let docSize = body.fileSize;

      if (file && typeof file === 'object' && file.name) {
        docName = file.name;
        docType = file.type || 'application/octet-stream';
        docSize = file.size;
        docUrl = URL.createObjectURL(file);
      }

      if (existingIdx >= 0) {
        lessonNotes[existingIdx] = {
          ...lessonNotes[existingIdx],
          lessonId: lessonId !== undefined ? lessonId : lessonNotes[existingIdx].lessonId,
          lessonName: lsn ? lsn.lessonName : lessonNotes[existingIdx].lessonName,
          title: title !== undefined ? String(title).trim() : lessonNotes[existingIdx].title,
          content: content !== undefined ? String(content).trim() : lessonNotes[existingIdx].content,
          status: status !== undefined ? status : lessonNotes[existingIdx].status,
          documentUrl: docUrl !== undefined ? docUrl : lessonNotes[existingIdx].documentUrl,
          fileName: docName !== undefined ? docName : lessonNotes[existingIdx].fileName,
          filename: docName !== undefined ? docName : lessonNotes[existingIdx].filename,
          fileType: docType !== undefined ? docType : lessonNotes[existingIdx].fileType,
          fileSize: docSize !== undefined ? docSize : lessonNotes[existingIdx].fileSize,
          updatedAt: new Date().toISOString(),
        };
        return lessonNotes[existingIdx];
      }
      const newId = lessonNotes.length + 1;
      const note: LessonNotes = {
        lessonNotesId: newId,
        lessonNotesRefId: refId,
        lessonId: lessonId,
        lessonName: lsn ? lsn.lessonName : undefined,
        title: String(title ?? '').trim(),
        content: String(content ?? '').trim(),
        status: status !== undefined ? status : 1,
        documentUrl: docUrl || null,
        fileName: docName || null,
        filename: docName || null,
        fileType: docType || null,
        fileSize: docSize || null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      lessonNotes.unshift(note);
      return note;
    },

    async remove(refOrId: string) {
      await delay();
      const i = lessonNotes.findIndex(
        (x) => x.lessonNotesRefId === refOrId || x.id === refOrId
      );
      if (i >= 0) lessonNotes.splice(i, 1);
    },
  },

  userLessonMappings: {
    async list(params: { search?: string; status?: any; userId?: any; lessonId?: any; page?: number; pageSize?: number } = {}) {
      await delay();
      let list = userLessonMappings;
      if (params.userId !== undefined && params.userId !== null && params.userId !== 'all') {
        list = list.filter((m) => String(m.userId) === String(params.userId));
      }
      if (params.lessonId !== undefined && params.lessonId !== null && params.lessonId !== 'all') {
        list = list.filter((m) => String(m.lessonId) === String(params.lessonId));
      }
      if (params.status !== undefined && params.status !== null && params.status !== 'all') {
        list = list.filter((m) => String(m.status) === String(params.status));
      }
      return paginate(list, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const item = userLessonMappings.find(
        (x) => x.userLessonRefId === refOrId || x.id === refOrId
      );
      if (!item) throw Object.assign(new Error('User Lesson Mapping not found'), { status: 404 });
      return item;
    },
    async create(body: any) {
      await delay();
      const refId =
        body.userLessonRefId && String(body.userLessonRefId).trim()
          ? body.userLessonRefId
          : `uuid-ulm-${Date.now()}`;
      const usr = users.find(
        (u) => String(u.user_id) === String(body.userId) || u.user_ref_id === String(body.userId) || u.id === String(body.userId)
      );
      const lsn = lessons.find(
        (l) => String(l.lessonId) === String(body.lessonId) || l.lessonRefId === String(body.lessonId) || l.id === String(body.lessonId)
      );
      const existingIdx = userLessonMappings.findIndex(
        (x) => x.userLessonRefId === body.userLessonRefId || x.id === body.userLessonRefId
      );
      if (existingIdx >= 0) {
        userLessonMappings[existingIdx] = {
          ...userLessonMappings[existingIdx],
          userId: body.userId !== undefined ? (Number(body.userId) || body.userId) : userLessonMappings[existingIdx].userId,
          lessonId: body.lessonId !== undefined ? body.lessonId : userLessonMappings[existingIdx].lessonId,
          userName: usr ? usr.name : userLessonMappings[existingIdx].userName,
          userEmail: usr ? usr.email : userLessonMappings[existingIdx].userEmail,
          lessonName: lsn ? lsn.lessonName : userLessonMappings[existingIdx].lessonName,
          user: usr ? { id: usr.id, name: usr.name, email: usr.email, user_id: usr.user_id } : userLessonMappings[existingIdx].user,
          status: body.status !== undefined ? Number(body.status) : userLessonMappings[existingIdx].status,
          updatedAt: new Date().toISOString(),
        };
        return userLessonMappings[existingIdx];
      }
      const newId = userLessonMappings.length + 1;
      const mapping: UserLessonMapping = {
        userLessonId: newId,
        userLessonRefId: refId,
        userId: Number(body.userId) || body.userId,
        lessonId: body.lessonId,
        userName: usr ? usr.name : undefined,
        userEmail: usr ? usr.email : undefined,
        lessonName: lsn ? lsn.lessonName : undefined,
        user: usr ? { id: usr.id, name: usr.name, email: usr.email, user_id: usr.user_id } : undefined,
        status: body.status !== undefined ? Number(body.status) : 1,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
        id: refId,
      };
      userLessonMappings.unshift(mapping);
      return mapping;
    },
    async remove(refOrId: string) {
      await delay();
      const i = userLessonMappings.findIndex(
        (x) => x.userLessonRefId === refOrId || x.id === refOrId
      );
      if (i >= 0) userLessonMappings.splice(i, 1);
    },
  },
};


export const demoCredentials = [
  { email: 'admin@codeclass.dev', password: 'password', role: 'admin' },
  { email: 'student@codeclass.dev', password: 'password', role: 'user' },
];
