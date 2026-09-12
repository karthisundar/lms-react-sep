// Unified service: uses the real REST API when VITE_API_BASE_URL is set,
// otherwise falls back to the in-memory demo data so the UI is fully explorable.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketUpdateInput,
  ListParams,
  PaginatedResponse,
  Session,
  SessionCreateInput,
  SessionUpdateInput,
  User,
  UserCreateInput,
  UserDeleteInput,
  UserSessionMapping,
  UserSessionMappingInput,
  UserUpdateInput,
  Video,
  VideoCreateInput,
  VideoUpdateInput,
} from '@/types/api';
import {
  authApi,
  bucketsApi,
  clearSession,
  getStoredUser,
  getToken,
  mappingsApi,
  profileApi,
  sessionsApi,
  setSession,
  studentApi,
  usersApi,
  videosApi,
} from './api';
import { demoApi } from './demoApi';

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const api = {
  isDemoMode,

  // auth + storage passthrough (always real localStorage)
  getToken,
  setSession,
  clearSession,
  getStoredUser,

  auth: {
    login: (body: AuthLoginRequest): Promise<AuthLoginResponse> =>
      isDemoMode ? demoApi.login(body) : authApi.login(body),
    me: (): Promise<User> => (isDemoMode ? demoApi.me() : authApi.me()),
    clientLabel: () => authApi.clientLabel(),
    fetchClientLabels: () => authApi.fetchClientLabels(),
    getClientLabel: (code?: string) => authApi.getClientLabel(code),
  },

  profile: {
    get: (): Promise<User> => (isDemoMode ? demoApi.profile() : profileApi.get()),
  },

  student: {
    mySessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.mySessions(params) : studentApi.mySessions(params),
    session: (id: string): Promise<Session> =>
      isDemoMode ? demoApi.session(id) : studentApi.session(id),
    videoForSession: (sessionId: string): Promise<Video> =>
      isDemoMode ? demoApi.videoForSession(sessionId) : studentApi.videoForSession(sessionId),
  },

  sessions: {
    list: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.sessions.list(params) : sessionsApi.list(params),
    get: (id: string): Promise<Session> =>
      isDemoMode ? demoApi.sessions.get(id) : sessionsApi.get(id),
    create: (body: SessionCreateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionsApi.create(body),
    update: (id: string, body: SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.update(id, body) : sessionsApi.update(id, body),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.sessions.remove(id) : sessionsApi.remove(id),
  },

  buckets: {
    list: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
      isDemoMode ? demoApi.buckets.list(params) : bucketsApi.list(params),
    create: (body: BucketCreateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.create(body) : bucketsApi.create(body),
    update: (id: string, body: BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.update(id, body) : bucketsApi.update(id, body),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.buckets.remove(id) : bucketsApi.remove(id),
  },

  videos: {
    list: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
      isDemoMode ? demoApi.videos.list(params) : videosApi.list(params),
    create: (body: VideoCreateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videosApi.create(body),
    update: (id: string, body: VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.update(id, body) : videosApi.update(id, body),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.videos.remove(id) : videosApi.remove(id),
  },

  mappings: {
    list: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
      isDemoMode ? demoApi.mappings.list(params) : mappingsApi.list(params),
    create: (body: UserSessionMappingInput): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body) : mappingsApi.create(body),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.mappings.remove(id) : mappingsApi.remove(id),
  },

  users: {
    getAllUsers: (params?: ListParams): Promise<PaginatedResponse<User>> =>
      isDemoMode ? demoApi.users.list(params) : usersApi.getAllUsers(params),
    list: (params?: ListParams): Promise<PaginatedResponse<User>> =>
      isDemoMode ? demoApi.users.list(params) : usersApi.list(params),
    get: (id: string): Promise<User> =>
      isDemoMode ? demoApi.users.get(id) : usersApi.get(id),
    create: (body: UserCreateInput | UserUpdateInput): Promise<User> =>
      isDemoMode ? demoApi.users.create(body) : usersApi.create(body),
    update: (payload: UserUpdateInput | string, body?: UserUpdateInput): Promise<User> =>
      isDemoMode ? demoApi.users.update(typeof payload === 'string' ? payload : payload.user_ref_id, body || (payload as UserUpdateInput)) : usersApi.update(payload, body),
    remove: (payload: UserDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.users.remove(typeof payload === 'string' ? payload : payload.user_ref_id) : usersApi.remove(payload),
    getUsers: (params?: ListParams): Promise<PaginatedResponse<User>> =>
      isDemoMode ? demoApi.users.list(params) : usersApi.list(params),
    getUserById: (id: string): Promise<User> =>
      isDemoMode ? demoApi.users.get(id) : usersApi.get(id),
    createUser: (body: UserCreateInput | UserUpdateInput): Promise<User> =>
      isDemoMode ? demoApi.users.create(body) : usersApi.create(body),
    updateUser: (payload: UserUpdateInput | string, body?: UserUpdateInput): Promise<User> =>
      isDemoMode ? demoApi.users.update(typeof payload === 'string' ? payload : payload.user_ref_id, body || (payload as UserUpdateInput)) : usersApi.update(payload, body),
    deleteUser: (payload: UserDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.users.remove(typeof payload === 'string' ? payload : payload.user_ref_id) : usersApi.remove(payload),
  },
};

export { userService } from './userService';
