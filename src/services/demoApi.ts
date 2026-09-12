// Demo-mode data layer used when VITE_API_BASE_URL is empty.
// Returns the same shapes the real REST API would, so the UI is identical.
// When a backend URL is configured, the real api.ts service is used instead.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  PaginatedResponse,
  Session,
  User,
  UserCreateInput,
  UserSessionMapping,
  UserUpdateInput,
  Video,
} from '@/types/api';

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
    id: 's1',
    name: 'Intro to TypeScript',
    description: 'Types, interfaces, and generics from the ground up.',
    date: '2026-08-01T10:00:00Z',
    status: 'published',
  },
  {
    id: 's2',
    name: 'React Hooks Deep Dive',
    description: 'useState, useEffect, useReducer, and custom hooks.',
    date: '2026-08-08T10:00:00Z',
    status: 'published',
  },
  {
    id: 's3',
    name: 'Supabase + Postgres RLS',
    description: 'Row-level security patterns for multi-tenant apps.',
    date: '2026-08-15T10:00:00Z',
    status: 'published',
  },
  {
    id: 's4',
    name: 'Edge Functions with Deno',
    description: 'Deploy serverless functions on Supabase.',
    date: '2026-08-22T10:00:00Z',
    status: 'draft',
  },
];

const buckets: Bucket[] = [
  {
    id: 'b1',
    name: 'recordings-primary',
    provider: 's3',
    url: 's3://codeclass-recordings/primary',
    config: { region: 'us-east-1' },
  },
  {
    id: 'b2',
    name: 'archive-cold',
    provider: 'gcs',
    url: 'gs://codeclass-archive/cold',
    config: { storageClass: 'NEARLINE' },
  },
];

const videos: Video[] = [
  {
    id: 'v1',
    title: 'Intro to TypeScript — Full Recording',
    filename: 'intro-ts.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSec: 596,
    sessionId: 's1',
    bucketId: 'b1',
  },
  {
    id: 'v2',
    title: 'React Hooks Deep Dive — Full Recording',
    filename: 'react-hooks.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSec: 653,
    sessionId: 's2',
    bucketId: 'b1',
  },
  {
    id: 'v3',
    title: 'Supabase RLS — Full Recording',
    filename: 'supabase-rls.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    signedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 15,
    sessionId: 's3',
    bucketId: 'b2',
  },
];

const mappings: UserSessionMapping[] = [
  { id: 'm1', userId: 'u-student', sessionId: 's1', user: { id: 'u-student', name: student.name, email: student.email }, session: { id: 's1', name: sessions[0].name, date: sessions[0].date } },
  { id: 'm2', userId: 'u-student', sessionId: 's2', user: { id: 'u-student', name: student.name, email: student.email }, session: { id: 's2', name: sessions[1].name, date: sessions[1].date } },
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
    const mine = sessions.filter((s) => mappings.some((m) => m.userId === 'u-student' && m.sessionId === s.id));
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
    const v = videos.find((x) => x.sessionId === sessionId);
    if (!v) throw Object.assign(new Error('No video for this session'), { status: 404 });
    return { ...v, signedUrl: v.url };
  },

  sessions: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(sessions, params.search, params.page, params.pageSize);
    },
    async get(id: string) {
      await delay();
      return sessions.find((x) => x.id === id)!;
    },
    async create(body: Omit<Session, 'id'>) {
      await delay();
      const s: Session = { ...body, id: `s${sessions.length + 1}` };
      sessions.unshift(s);
      return s;
    },
    async update(id: string, body: Partial<Session>) {
      await delay();
      const idx = sessions.findIndex((x) => x.id === id);
      sessions[idx] = { ...sessions[idx], ...body };
      return sessions[idx];
    },
    async remove(id: string) {
      await delay();
      const i = sessions.findIndex((x) => x.id === id);
      if (i >= 0) sessions.splice(i, 1);
    },
  },

  buckets: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(buckets, params.search, params.page, params.pageSize);
    },
    async create(body: Omit<Bucket, 'id'>) {
      await delay();
      const b: Bucket = { ...body, id: `b${buckets.length + 1}` };
      buckets.unshift(b);
      return b;
    },
    async update(id: string, body: Partial<Bucket>) {
      await delay();
      const idx = buckets.findIndex((x) => x.id === id);
      buckets[idx] = { ...buckets[idx], ...body };
      return buckets[idx];
    },
    async remove(id: string) {
      await delay();
      const i = buckets.findIndex((x) => x.id === id);
      if (i >= 0) buckets.splice(i, 1);
    },
  },

  videos: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(videos, params.search, params.page, params.pageSize);
    },
    async create(body: Omit<Video, 'id'>) {
      await delay();
      const v: Video = { ...body, id: `v${videos.length + 1}` };
      videos.unshift(v);
      return v;
    },
    async update(id: string, body: Partial<Video>) {
      await delay();
      const idx = videos.findIndex((x) => x.id === id);
      videos[idx] = { ...videos[idx], ...body };
      return videos[idx];
    },
    async remove(id: string) {
      await delay();
      const i = videos.findIndex((x) => x.id === id);
      if (i >= 0) videos.splice(i, 1);
    },
  },

  mappings: {
    async list(params: { search?: string; page?: number; pageSize?: number } = {}) {
      await delay();
      return paginate(mappings, params.search, params.page, params.pageSize);
    },
    async create(body: { userId: string; sessionId: string }) {
      await delay();
      const u = users.find((x) => x.id === body.userId)!;
      const s = sessions.find((x) => x.id === body.sessionId)!;
      const m: UserSessionMapping = {
        id: `m${mappings.length + 1}`,
        userId: body.userId,
        sessionId: body.sessionId,
        user: { id: u.id, name: u.name, email: u.email },
        session: { id: s.id, name: s.name, date: s.date },
      };
      mappings.unshift(m);
      return m;
    },
    async remove(id: string) {
      await delay();
      const i = mappings.findIndex((x) => x.id === id);
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
    async create(body: any) {
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
        createdAt: body.createdAt || new Date().toISOString(),
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
