// Unified service: uses the real REST API when VITE_API_BASE_URL is set,
// otherwise falls back to the in-memory demo data so the UI is fully explorable.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketDeleteInput,
  BucketUpdateInput,
  ListParams,
  PaginatedResponse,
  Session,
  SessionCreateInput,
  SessionDeleteInput,
  SessionUpdateInput,
  User,
  UserCreateInput,
  UserDeleteInput,
  UserSessionMapping,
  UserSessionMappingCreateInput,
  UserSessionMappingDeleteInput,
  UserSessionMappingInput,
  UserSessionMappingUpdateInput,
  UserUpdateInput,
  Video,
  VideoCreateInput,
  VideoDeleteInput,
  VideoUpdateInput,
} from '@/types/api';
import {
  authApi,
  bucketMasterApi,
  clearSession,
  getStoredUser,
  getToken,
  mappingsApi,
  profileApi,
  sessionMasterApi,
  sessionsApi,
  setSession,
  studentApi,
  userSessionMappingApi,
  usersApi,
  videoMasterApi,
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

  sessionMaster: {
    getAllSessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.sessions.list(params) : sessionMasterApi.getAllSessions(params),
    getSession: (sessionRefId: string): Promise<Session> =>
      isDemoMode ? demoApi.sessions.get(sessionRefId) : sessionMasterApi.getSession(sessionRefId),
    createSession: (body: SessionCreateInput | SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionMasterApi.createSession(body),
    updateSession: (body: SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionMasterApi.createSession(body),
    deleteSession: (payload: SessionDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.sessions.remove(typeof payload === 'string' ? payload : payload.sessionRefId) : sessionMasterApi.deleteSession(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.sessions.list(params) : sessionMasterApi.getAllSessions(params),
    get: (sessionRefId: string): Promise<Session> =>
      isDemoMode ? demoApi.sessions.get(sessionRefId) : sessionMasterApi.getSession(sessionRefId),
    create: (body: SessionCreateInput | SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionMasterApi.createSession(body),
    update: (body: SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionMasterApi.createSession(body),
    remove: (payload: SessionDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.sessions.remove(typeof payload === 'string' ? payload : payload.sessionRefId) : sessionMasterApi.deleteSession(payload),
  },

  sessions: {
    list: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.sessions.list(params) : sessionMasterApi.getAllSessions(params),
    get: (id: string): Promise<Session> =>
      isDemoMode ? demoApi.sessions.get(id) : sessionMasterApi.getSession(id),
    create: (body: SessionCreateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create(body) : sessionMasterApi.createSession(body),
    update: (id: string, body: SessionUpdateInput): Promise<Session> =>
      isDemoMode ? demoApi.sessions.create({ ...body, sessionRefId: id }) : sessionMasterApi.createSession({ ...body, sessionRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.sessions.remove(id) : sessionMasterApi.deleteSession({ sessionRefId: id }),
  },

  bucketMaster: {
    getAllBuckets: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
      isDemoMode ? demoApi.buckets.list(params) : bucketMasterApi.getAllBuckets(params),
    getBucket: (bucketRefId: string): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.get(bucketRefId) : bucketMasterApi.getBucket(bucketRefId),
    createBucket: (body: BucketCreateInput | BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.create(body) : bucketMasterApi.createBucket(body),
    update: (body: BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.update(body.bucketRefId, body) : bucketMasterApi.update(body),
    deleteBucket: (payload: BucketDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.buckets.remove(typeof payload === 'string' ? payload : payload.bucketRefId) : bucketMasterApi.deleteBucket(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
      isDemoMode ? demoApi.buckets.list(params) : bucketMasterApi.getAllBuckets(params),
    get: (bucketRefId: string): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.get(bucketRefId) : bucketMasterApi.getBucket(bucketRefId),
    create: (body: BucketCreateInput | BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.create(body) : bucketMasterApi.createBucket(body),
    remove: (payload: BucketDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.buckets.remove(typeof payload === 'string' ? payload : payload.bucketRefId) : bucketMasterApi.deleteBucket(payload),
  },

  buckets: {
    list: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
      isDemoMode ? demoApi.buckets.list(params) : bucketMasterApi.getAllBuckets(params),
    get: (bucketRefId: string): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.get(bucketRefId) : bucketMasterApi.getBucket(bucketRefId),
    create: (body: BucketCreateInput | BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.create(body) : bucketMasterApi.createBucket(body),
    update: (id: string, body: BucketUpdateInput): Promise<Bucket> =>
      isDemoMode ? demoApi.buckets.update(id, body) : bucketMasterApi.createBucket({ ...body, bucketRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.buckets.remove(id) : bucketMasterApi.deleteBucket({ bucketRefId: id }),
  },

  videoMaster: {
    getAllVideos: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
      isDemoMode ? demoApi.videos.list(params) : videoMasterApi.getAllVideos(params),
    getVideo: (videoRefId: string): Promise<Video> =>
      isDemoMode ? demoApi.videos.get(videoRefId) : videoMasterApi.getVideo(videoRefId),
    createVideo: (body: VideoCreateInput | VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    updateVideo: (body: VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    deleteVideo: (payload: VideoDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.videos.remove(typeof payload === 'string' ? payload : payload.videoRefId) : videoMasterApi.deleteVideo(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
      isDemoMode ? demoApi.videos.list(params) : videoMasterApi.getAllVideos(params),
    get: (videoRefId: string): Promise<Video> =>
      isDemoMode ? demoApi.videos.get(videoRefId) : videoMasterApi.getVideo(videoRefId),
    create: (body: VideoCreateInput | VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    update: (body: VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    remove: (payload: VideoDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.videos.remove(typeof payload === 'string' ? payload : payload.videoRefId) : videoMasterApi.deleteVideo(payload),
  },

  videos: {
    getAllVideos: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
      isDemoMode ? demoApi.videos.list(params) : videoMasterApi.getAllVideos(params),
    getVideo: (videoRefId: string): Promise<Video> =>
      isDemoMode ? demoApi.videos.get(videoRefId) : videoMasterApi.getVideo(videoRefId),
    createVideo: (body: VideoCreateInput | VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    updateVideo: (body: VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    deleteVideo: (payload: VideoDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.videos.remove(typeof payload === 'string' ? payload : payload.videoRefId) : videoMasterApi.deleteVideo(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
      isDemoMode ? demoApi.videos.list(params) : videoMasterApi.getAllVideos(params),
    get: (id: string): Promise<Video> =>
      isDemoMode ? demoApi.videos.get(id) : videoMasterApi.getVideo(id),
    create: (body: VideoCreateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create(body) : videoMasterApi.createVideo(body),
    update: (id: string, body: VideoUpdateInput): Promise<Video> =>
      isDemoMode ? demoApi.videos.create({ ...body, videoRefId: id }) : videoMasterApi.createVideo({ ...body, videoRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.videos.remove(id) : videoMasterApi.deleteVideo({ videoRefId: id }),
  },

  userSessionMapping: {
    getAllUserSessionMappings: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
      isDemoMode ? demoApi.mappings.list(params) : userSessionMappingApi.getAllUserSessionMappings(params),
    getUserSessionMapping: (userSessionRefId: string): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.get(userSessionRefId) : userSessionMappingApi.getUserSessionMapping(userSessionRefId),
    createUserSessionMapping: (
      body: UserSessionMappingCreateInput | UserSessionMappingUpdateInput | UserSessionMappingInput
    ): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body as any) : userSessionMappingApi.createUserSessionMapping(body),
    deleteUserSessionMapping: (payload: UserSessionMappingDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.mappings.remove(typeof payload === 'string' ? payload : payload.userSessionRefId) : userSessionMappingApi.deleteUserSessionMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
      isDemoMode ? demoApi.mappings.list(params) : userSessionMappingApi.getAllUserSessionMappings(params),
    get: (userSessionRefId: string): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.get(userSessionRefId) : userSessionMappingApi.getUserSessionMapping(userSessionRefId),
    create: (body: UserSessionMappingCreateInput | UserSessionMappingInput): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body as any) : userSessionMappingApi.createUserSessionMapping(body),
    update: (body: UserSessionMappingUpdateInput): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body as any) : userSessionMappingApi.createUserSessionMapping(body),
    remove: (payload: UserSessionMappingDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.mappings.remove(typeof payload === 'string' ? payload : payload.userSessionRefId) : userSessionMappingApi.deleteUserSessionMapping(payload),
  },

  mappings: {
    getAllUserSessionMappings: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
      isDemoMode ? demoApi.mappings.list(params) : userSessionMappingApi.getAllUserSessionMappings(params),
    getUserSessionMapping: (userSessionRefId: string): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.get(userSessionRefId) : userSessionMappingApi.getUserSessionMapping(userSessionRefId),
    createUserSessionMapping: (
      body: UserSessionMappingCreateInput | UserSessionMappingUpdateInput | UserSessionMappingInput
    ): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body as any) : userSessionMappingApi.createUserSessionMapping(body),
    deleteUserSessionMapping: (payload: UserSessionMappingDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.mappings.remove(typeof payload === 'string' ? payload : payload.userSessionRefId) : userSessionMappingApi.deleteUserSessionMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
      isDemoMode ? demoApi.mappings.list(params) : userSessionMappingApi.getAllUserSessionMappings(params),
    get: (id: string): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.get(id) : userSessionMappingApi.getUserSessionMapping(id),
    create: (body: UserSessionMappingInput | UserSessionMappingCreateInput): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create(body as any) : userSessionMappingApi.createUserSessionMapping(body),
    update: (id: string, body: UserSessionMappingUpdateInput): Promise<UserSessionMapping> =>
      isDemoMode ? demoApi.mappings.create({ ...body, userSessionRefId: id } as any) : userSessionMappingApi.createUserSessionMapping({ ...body, userSessionRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.mappings.remove(id) : userSessionMappingApi.deleteUserSessionMapping({ userSessionRefId: id }),
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
export { bucketMasterService } from './bucketMasterService';
export { sessionMasterService } from './sessionMasterService';
export { videoService, videoMasterService } from './videoService';
export { userSessionMappingService, mappingService } from './userSessionMappingService';


