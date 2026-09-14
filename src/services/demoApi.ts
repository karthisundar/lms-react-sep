// Demo-mode data layer used when VITE_API_BASE_URL is empty.
// Returns the same shapes the real REST API would, so the UI is identical.
// When a backend URL is configured, the real api.ts service is used instead.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketUpdateInput,
  PaginatedResponse,
  Session,
  User,
  UserCreateInput,
  UserSessionMapping,
  UserUpdateInput,
  Video,
} from '@/types/api';
import { getStoredUser, getToken, getUserFromToken } from './api';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

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
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(sessions, params.search, params.page, params.pageSize);
    },
    async get(refOrId: string) {
      await delay();
      const s = sessions.find((x) => x.sessionRefId === refOrId || x.id === refOrId);
      if (!s) throw Object.assign(new Error('Session not found'), { status: 404 });
      return s;
    },
    async create(body: any) {
      await delay();
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
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(videos, params.search, params.page, params.pageSize);
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
        status: 1,
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
};

export const demoCredentials = [
  { email: 'admin@codeclass.dev', password: 'password', role: 'admin' },
  { email: 'student@codeclass.dev', password: 'password', role: 'user' },
];
