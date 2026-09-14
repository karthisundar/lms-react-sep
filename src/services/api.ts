import type {
  ApiErrorResponse,
  ApiLoginResponse,
  ApiPaginatedResponse,
  ApiResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketDeleteInput,
  BucketProvider,
  BucketUpdateInput,
  ClientLabelItem,
  ClientLabelResponse,
  ListParams,
  PaginatedResponse,
  Role,
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100').replace(/\/$/, '');
const BASE_URL = `${API_BASE_URL}/api`;

const TOKEN_KEY = 'access_token';
const USER_KEY = 'cc_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('cc_token');
}

export function setSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('cc_token', token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('cc_token');
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  status: number;
  data?: ApiErrorResponse | Record<string, unknown>;
  code?: string;

  constructor(message: string, status: number, data?: ApiErrorResponse | Record<string, unknown>, code?: string) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

interface TokenClaims {
  id?: string | number;
  userId?: string | number;
  _id?: string | number;
  sub?: string | number;
  email?: string;
  name?: string;
  username?: string;
  role?: string | string[];
  roles?: string[];
  roleName?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  is_active?: boolean;
  createdAt?: string;
  user?: TokenClaims;
  data?: TokenClaims;
}

export function decodeJwt<T = TokenClaims>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

export function getUserFromToken(token: string): User {
  const decoded = decodeJwt<TokenClaims>(token) || {};
  const data = decoded.user || decoded.data || decoded;

  const id = data.id || data.userId || data._id || data.sub || 'u-default';
  const email = data.email || '';
  const name = data.name || data.username || (email ? email.split('@')[0] : 'User');

  let role: Role = 'user';
  const rawRole = data.role ?? data.roles ?? data.roleName ?? (data.isAdmin ? 'admin' : undefined);
  if (typeof rawRole === 'string') {
    role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'user';
  } else if (Array.isArray(rawRole)) {
    role = rawRole.some((r: string) => String(r).toLowerCase().includes('admin')) ? 'admin' : 'user';
  }

  return {
    id: String(id),
    name: String(name),
    email: String(email),
    role,
    avatarUrl: data.avatarUrl || '',
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    createdAt: data.createdAt,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = localStorage.getItem('access_token') || getToken();
  if (token) headers['Authorization'] = `${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let errorData: ApiErrorResponse | null = null;
    let code: string | undefined;
    try {
      errorData = (await res.json()) as ApiErrorResponse;
      const rawCode = errorData?.response?.code;
      code = Array.isArray(rawCode) ? rawCode[0] : (typeof rawCode === 'string' ? rawCode : undefined);
      message = errorData?.response?.message || errorData?.message || message;
    } catch {
      // ignore parse error
    }
    throw new HttpError(message, res.status, errorData || undefined, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function withQuery(params: ListParams = {}): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  const q = sp.toString();
  return q ? `?${q}` : '';
}

let clientLabelCache: Record<string, ClientLabelItem> | null = null;

// ---- Auth ----
export const authApi = {
  login: async (body: AuthLoginRequest): Promise<AuthLoginResponse> => {
    const res = await request<ApiLoginResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.statusCode !== 200 || !res.response?.data?.[0]?.token) {
      throw new HttpError('Invalid response from login server', res.statusCode || 500);
    }

    const token = res.response.data[0].token;
    const user = getUserFromToken(token);
    if (!user.email && body.email) {
      user.email = body.email;
    }

    setSession(token, user);

    // Call /api/user/clientLabel after authentication
    try {
      const labelRes = await authApi.clientLabel();
      if (labelRes?.response?.data) {
        clientLabelCache = labelRes.response.data;
      }
    } catch {
      // Non-blocking if clientLabel network error occurs
    }

    return { token, user };
  },
  logout: () => request<void>('/user/logout', { method: 'POST' }),
  me: () => request<User>('/user/me'),
  clientLabel: () => request<ClientLabelResponse>('/user/clientLabel', { method: 'GET' }),
  fetchClientLabels: async (): Promise<Record<string, ClientLabelItem>> => {
    if (clientLabelCache) return clientLabelCache;
    try {
      const res = await authApi.clientLabel();
      if (res?.response?.data) {
        clientLabelCache = res.response.data;
      }
    } catch {
      // ignore
    }
    return clientLabelCache || {};
  },
  getClientLabel: (code?: string): string | null => {
    if (!code || !clientLabelCache) return null;
    return clientLabelCache[code]?.message || null;
  },
};

// ---- Profile ----
export const profileApi = {
  get: () => request<User>('/profile'),
};

// ---- Student sessions ----
export const studentApi = {
  mySessions: (params: ListParams = {}) =>
    request<PaginatedResponse<Session>>(`/sessions/mine${withQuery(params)}`),
  session: (id: string) => request<Session>(`/sessions/${id}`),
  videoForSession: (sessionId: string) =>
    request<Video>(`/sessions/${sessionId}/video`),
};

export function normalizeSession(s: Record<string, any>): Session {
  const sessionMasterId = Number(s.sessionMasterId ?? s.id ?? 0);
  const sessionRefId = String(s.sessionRefId ?? s.id ?? '');
  const sessionCode = String(s.sessionCode ?? '');
  const sessionName = String(s.sessionName ?? s.name ?? '');
  const description = s.description !== undefined && s.description !== null ? String(s.description) : null;
  const startDate = s.startDate ?? s.date ?? null;
  const endDate = s.endDate ?? null;
  const status = String(s.status ?? 'draft');

  return {
    sessionMasterId,
    sessionRefId,
    sessionCode,
    sessionName,
    description,
    startDate: startDate ? String(startDate) : null,
    endDate: endDate ? String(endDate) : null,
    status,
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : undefined,
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : null,
    deletedAt: typeof s.deletedAt === 'string' ? s.deletedAt : null,
    createdBy: typeof s.createdBy === 'number' ? s.createdBy : null,
    updatedBy: typeof s.updatedBy === 'number' ? s.updatedBy : null,
    deletedBy: typeof s.deletedBy === 'number' ? s.deletedBy : null,
    // compatibility helpers
    id: sessionRefId || String(sessionMasterId),
    name: sessionName,
    date: startDate ? String(startDate) : '',
  };
}

// ---- Admin: Session Master ----
export const SESSION_MASTER_BASE_URL = '/sessionMaster';

export const sessionMasterApi = {
  getAllSessions: async (params: ListParams = {}): Promise<PaginatedResponse<Session>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Session>>(`${SESSION_MASTER_BASE_URL}/getAllSessions${query}`);
    const paginationData = res?.response?.data?.[0];

    if (!paginationData) {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: String(page),
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const rawRows = paginationData.row || [];
    const normalizedRows = rawRows.map(normalizeSession);
    const totalItem = Number(paginationData.totalItem) || normalizedRows.length;
    const totalPage = Number(paginationData.totalPage) || Math.max(1, Math.ceil(totalItem / pageSize));
    const currentPage = Number(paginationData.currentPage ?? page);

    return {
      totalItem,
      totalPage,
      row: normalizedRows,
      currentPage: String(currentPage),
      items: normalizedRows,
      total: totalItem,
      page: currentPage,
      pageSize,
    };
  },

  getSession: async (sessionRefId: string): Promise<Session> => {
    const res = await request<ApiResponse<Session> | Record<string, unknown>>(
      `${SESSION_MASTER_BASE_URL}/getSession?sessionRefId=${encodeURIComponent(sessionRefId)}`
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = responseObj;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.row)) {
        raw = (dataObj.row[0] as Record<string, unknown>) ?? dataObj;
      } else {
        raw = dataObj;
      }
    }
    return normalizeSession(raw);
  },

  createSession: async (body: SessionCreateInput | SessionUpdateInput): Promise<Session> => {
    const payload = {
      sessionRefId: body.sessionRefId ?? '',
      name: (body.name ?? '').trim(),
      description: body.description?.trim() ?? '',
      date: body.date ?? '',
      status: body.status ?? 'draft',
    };
    const res = await request<ApiResponse<Session> | Record<string, unknown>>(`${SESSION_MASTER_BASE_URL}/createSession`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = payload;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      raw = data as Record<string, unknown>;
    }
    return normalizeSession(raw);
  },

  deleteSession: async (payload: SessionDeleteInput | string): Promise<void> => {
    const sessionRefId = typeof payload === 'string' ? payload : payload.sessionRefId;
    return request<void>(`${SESSION_MASTER_BASE_URL}/deleteSession`, {
      method: 'POST',
      body: JSON.stringify({ sessionRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => sessionMasterApi.getAllSessions(params),
  get: (sessionRefId: string) => sessionMasterApi.getSession(sessionRefId),
  create: (body: SessionCreateInput | SessionUpdateInput) => sessionMasterApi.createSession(body),
  update: (idOrBody: string | SessionUpdateInput, body?: SessionUpdateInput) => {
    if (typeof idOrBody === 'string') {
      return sessionMasterApi.createSession({ ...(body || {}), sessionRefId: idOrBody });
    }
    return sessionMasterApi.createSession(idOrBody);
  },
  remove: (payload: SessionDeleteInput | string) => sessionMasterApi.deleteSession(payload),
};

export const sessionsApi = sessionMasterApi;


export function normalizeBucket(b: Record<string, any>): Bucket {
  const bucketId = Number(b.bucketId ?? b.id ?? 0);
  const bucketRefId = String(b.bucketRefId ?? b.id ?? '');
  const bucketName = String(b.bucketName ?? b.name ?? '');
  const serviceUrl = String(b.serviceUrl ?? b.url ?? '');
  const status = typeof b.status === 'number' ? b.status : (b.status === 'active' || b.is_active ? 1 : 0);

  return {
    bucketId,
    bucketRefId,
    bucketName,
    serviceUrl,
    status,
    createdAt: typeof b.createdAt === 'string' ? b.createdAt : undefined,
    updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : undefined,
    deletedAt: typeof b.deletedAt === 'string' ? b.deletedAt : null,
    // compatibility helpers
    id: bucketRefId || String(bucketId),
    name: bucketName,
    url: serviceUrl,
    provider: (b.provider as BucketProvider) ?? 'other',
    config: (b.config as Record<string, string> | null) ?? null,
  };
}

// ---- Admin: Bucket Master ----
export const BUCKET_MASTER_BASE_URL = '/bucketMaster';

export const bucketMasterApi = {
  getAllBuckets: async (params: ListParams = {}): Promise<PaginatedResponse<Bucket>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Bucket>>(`${BUCKET_MASTER_BASE_URL}/getAllBuckets${query}`);
    const paginationData = res?.response?.data?.[0];

    if (!paginationData) {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: String(page),
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const rawRows = paginationData.row || [];
    const normalizedRows = rawRows.map(normalizeBucket);
    const totalItem = Number(paginationData.totalItem) || normalizedRows.length;
    const totalPage = Number(paginationData.totalPage) || Math.max(1, Math.ceil(totalItem / pageSize));
    const currentPage = Number(paginationData.currentPage ?? page);

    return {
      totalItem,
      totalPage,
      row: normalizedRows,
      currentPage: String(currentPage),
      items: normalizedRows,
      total: totalItem,
      page: currentPage,
      pageSize,
    };
  },

  getBucket: async (bucketRefId: string): Promise<Bucket> => {
    const res = await request<ApiResponse<Bucket> | Record<string, unknown>>(
      `${BUCKET_MASTER_BASE_URL}/getBucket?bucketRefId=${encodeURIComponent(bucketRefId)}`
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = responseObj;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.row)) {
        raw = (dataObj.row[0] as Record<string, unknown>) ?? dataObj;
      } else {
        raw = dataObj;
      }
    }
    return normalizeBucket(raw);
  },

  createBucket: async (body: BucketCreateInput | BucketUpdateInput): Promise<Bucket> => {
    const payload = {
      bucketRefId: body.bucketRefId ?? '',
      bucketName: body.bucketName.trim(),
      serviceUrl: body.serviceUrl.trim(),
      status: Number(body.status),
    };
    const res = await request<ApiResponse<Bucket> | Record<string, unknown>>(`${BUCKET_MASTER_BASE_URL}/createBucket`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = payload;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      raw = data as Record<string, unknown>;
    }
    return normalizeBucket(raw);
  },

  deleteBucket: async (payload: BucketDeleteInput | string): Promise<void> => {
    const bucketRefId = typeof payload === 'string' ? payload : payload.bucketRefId;
    return request<void>(`${BUCKET_MASTER_BASE_URL}/deleteBucket`, {
      method: 'POST',
      body: JSON.stringify({ bucketRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => bucketMasterApi.getAllBuckets(params),
  get: (bucketRefId: string) => bucketMasterApi.getBucket(bucketRefId),
  create: (body: BucketCreateInput | BucketUpdateInput) => bucketMasterApi.createBucket(body),
  update: (body: BucketUpdateInput) => bucketMasterApi.createBucket(body),
  remove: (payload: BucketDeleteInput | string) => bucketMasterApi.deleteBucket(payload),
};

export const bucketsApi = bucketMasterApi;

export function normalizeVideo(v: Record<string, any>): Video {
  const videoId = Number(v.videoId ?? v.id ?? 0);
  const videoRefId = String(v.videoRefId ?? v.id ?? '');
  const title = String(v.title ?? '');
  const filename = String(v.filename ?? '');
  const url = String(v.url ?? '');
  const sessionId = String(v.sessionId ?? '');
  const bucketId = String(v.bucketId ?? '');

  return {
    videoId,
    videoRefId,
    title,
    filename,
    url,
    sessionId,
    bucketId,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : undefined,
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : null,
    deletedAt: typeof v.deletedAt === 'string' ? v.deletedAt : null,
    createdBy: typeof v.createdBy === 'number' ? v.createdBy : null,
    updatedBy: typeof v.updatedBy === 'number' ? v.updatedBy : null,
    deletedBy: typeof v.deletedBy === 'number' ? v.deletedBy : null,
    // Compatibility helpers
    id: videoRefId || String(videoId),
    signedUrl: typeof v.signedUrl === 'string' ? v.signedUrl : undefined,
    durationSec: typeof v.durationSec === 'number' ? v.durationSec : undefined,
  };
}

// ---- Admin: Video Master ----
export const VIDEO_MASTER_BASE_URL = '/video';

export const videoMasterApi = {
  getAllVideos: async (params: ListParams = {}): Promise<PaginatedResponse<Video>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Video>>(`${VIDEO_MASTER_BASE_URL}/getAllVideos${query}`);
    const paginationData = res?.response?.data?.[0];

    if (!paginationData) {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: String(page),
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const rawRows = paginationData.row || [];
    const normalizedRows = rawRows.map(normalizeVideo);
    const totalItem = Number(paginationData.totalItem) || normalizedRows.length;
    const totalPage = Number(paginationData.totalPage) || Math.max(1, Math.ceil(totalItem / pageSize));
    const currentPage = Number(paginationData.currentPage ?? page);

    return {
      totalItem,
      totalPage,
      row: normalizedRows,
      currentPage: String(currentPage),
      items: normalizedRows,
      total: totalItem,
      page: currentPage,
      pageSize,
    };
  },

  getVideo: async (videoRefId: string): Promise<Video> => {
    const res = await request<ApiResponse<Video> | Record<string, unknown>>(
      `${VIDEO_MASTER_BASE_URL}/getVideo?videoRefId=${encodeURIComponent(videoRefId)}`
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = responseObj;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.row)) {
        raw = (dataObj.row[0] as Record<string, unknown>) ?? dataObj;
      } else {
        raw = dataObj;
      }
    }
    return normalizeVideo(raw);
  },

  createVideo: async (body: VideoCreateInput | VideoUpdateInput): Promise<Video> => {
    const payload = {
      videoRefId: body.videoRefId ?? '',
      title: (body.title ?? '').trim(),
      filename: (body.filename ?? '').trim(),
      url: (body.url ?? '').trim(),
      sessionId: body.sessionId ?? '',
      bucketId: body.bucketId ?? '',
    };
    const res = await request<ApiResponse<Video> | Record<string, unknown>>(`${VIDEO_MASTER_BASE_URL}/createVideo`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = payload;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      raw = data as Record<string, unknown>;
    }
    return normalizeVideo(raw);
  },

  deleteVideo: async (payload: VideoDeleteInput | string): Promise<void> => {
    const videoRefId = typeof payload === 'string' ? payload : payload.videoRefId;
    return request<void>(`${VIDEO_MASTER_BASE_URL}/deleteVideo`, {
      method: 'POST',
      body: JSON.stringify({ videoRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => videoMasterApi.getAllVideos(params),
  get: (videoRefId: string) => videoMasterApi.getVideo(videoRefId),
  create: (body: VideoCreateInput | VideoUpdateInput) => videoMasterApi.createVideo(body),
  update: (idOrBody: string | VideoUpdateInput, body?: VideoUpdateInput) => {
    if (typeof idOrBody === 'string') {
      return videoMasterApi.createVideo({ ...(body || {}), videoRefId: idOrBody });
    }
    return videoMasterApi.createVideo(idOrBody);
  },
  remove: (payload: VideoDeleteInput | string) => videoMasterApi.deleteVideo(payload),
};

export const videosApi = videoMasterApi;


export function normalizeUserSessionMapping(m: Record<string, any>): UserSessionMapping {
  const userSessionId = Number(m.userSessionId ?? m.id ?? 0);
  const userSessionRefId = String(m.userSessionRefId ?? m.id ?? '');
  const userId = typeof m.userId === 'number' ? m.userId : (Number(m.userId ?? m.user_id) || String(m.userId ?? m.user_id ?? ''));
  const sessionId = String(m.sessionId ?? m.sessionRefId ?? '');
  const status = typeof m.status === 'number' ? m.status : 1;

  return {
    userSessionId,
    userSessionRefId,
    userId,
    sessionId,
    status,
    createdBy: typeof m.createdBy === 'number' ? m.createdBy : null,
    updatedBy: typeof m.updatedBy === 'number' ? m.updatedBy : null,
    deletedBy: typeof m.deletedBy === 'number' ? m.deletedBy : null,
    createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined,
    updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : null,
    deletedAt: typeof m.deletedAt === 'string' ? m.deletedAt : null,
    // Compatibility helpers
    id: userSessionRefId || String(userSessionId),
    user: m.user,
    session: m.session,
  };
}

// ---- Admin: User-Session Mapping ----
export const userSessionMappingApi = {
  getAllUserSessionMappings: async (params: ListParams = {}): Promise<PaginatedResponse<UserSessionMapping>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<UserSessionMapping>>(`${SESSION_MASTER_BASE_URL}/getAllUserSessionMappings${query}`);
    const paginationData = res?.response?.data?.[0];

    if (!paginationData) {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: String(page),
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const rawRows = paginationData.row || [];
    const normalizedRows = rawRows.map(normalizeUserSessionMapping);
    const totalItem = Number(paginationData.totalItem) || normalizedRows.length;
    const totalPage = Number(paginationData.totalPage) || Math.max(1, Math.ceil(totalItem / pageSize));
    const currentPage = Number(paginationData.currentPage ?? page);

    return {
      totalItem,
      totalPage,
      row: normalizedRows,
      currentPage: String(currentPage),
      items: normalizedRows,
      total: totalItem,
      page: currentPage,
      pageSize,
    };
  },

  getUserSessionMapping: async (userSessionRefId: string): Promise<UserSessionMapping> => {
    const res = await request<ApiResponse<UserSessionMapping> | Record<string, unknown>>(
      `${SESSION_MASTER_BASE_URL}/getUserSessionMapping?userSessionRefId=${encodeURIComponent(userSessionRefId)}`
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = responseObj;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      const dataObj = data as Record<string, unknown>;
      if (Array.isArray(dataObj.row)) {
        raw = (dataObj.row[0] as Record<string, unknown>) ?? dataObj;
      } else {
        raw = dataObj;
      }
    }
    return normalizeUserSessionMapping(raw);
  },

  createUserSessionMapping: async (
    body: UserSessionMappingCreateInput | UserSessionMappingUpdateInput | UserSessionMappingInput
  ): Promise<UserSessionMapping> => {
    const payload = {
      userSessionRefId: body.userSessionRefId ?? '',
      userId: String(body.userId),
      sessionId: String(body.sessionId),
    };
    const res = await request<ApiResponse<UserSessionMapping> | Record<string, unknown>>(
      `${SESSION_MASTER_BASE_URL}/createUserSessionMapping`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = payload;
    if (Array.isArray(data)) {
      const first = data[0] as Record<string, unknown> | undefined;
      if (first && Array.isArray(first.row)) {
        raw = (first.row[0] as Record<string, unknown>) ?? first;
      } else if (first) {
        raw = first;
      }
    } else if (data && typeof data === 'object') {
      raw = data as Record<string, unknown>;
    }
    return normalizeUserSessionMapping(raw);
  },

  deleteUserSessionMapping: async (payload: UserSessionMappingDeleteInput | string): Promise<void> => {
    const userSessionRefId = typeof payload === 'string' ? payload : payload.userSessionRefId;
    return request<void>(`${SESSION_MASTER_BASE_URL}/deleteUserSessionMapping`, {
      method: 'POST',
      body: JSON.stringify({ userSessionRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => userSessionMappingApi.getAllUserSessionMappings(params),
  get: (userSessionRefId: string) => userSessionMappingApi.getUserSessionMapping(userSessionRefId),
  create: (body: UserSessionMappingCreateInput | UserSessionMappingInput) =>
    userSessionMappingApi.createUserSessionMapping(body),
  update: (
    idOrBody: string | UserSessionMappingUpdateInput,
    body?: Partial<UserSessionMappingUpdateInput>
  ) => {
    if (typeof idOrBody === 'string') {
      return userSessionMappingApi.createUserSessionMapping({
        ...(body || {}),
        userSessionRefId: idOrBody,
      } as UserSessionMappingUpdateInput);
    }
    return userSessionMappingApi.createUserSessionMapping(idOrBody);
  },
  remove: (payload: UserSessionMappingDeleteInput | string) =>
    userSessionMappingApi.deleteUserSessionMapping(payload),
};

export const mappingsApi = userSessionMappingApi;

export function normalizeUser(u: Record<string, any>): User {
  const id = String(u.user_id ?? u.id ?? u.user_ref_id ?? '');
  const roleStr = String(u.role ?? (u.role_id === 1 ? 'admin' : 'user')).toLowerCase();
  const role: Role = roleStr.includes('admin') ? 'admin' : 'user';
  const isActive =
    u.status !== undefined
      ? u.status === 'active'
      : u.is_active !== undefined
        ? Boolean(u.is_active)
        : true;

  const phone = String(u.phoneNumber ?? u.phone_number ?? '');

  return {
    id,
    name: u.name ?? '',
    email: u.email ?? '',
    role,
    avatarUrl: u.avatarUrl ?? '',
    is_active: isActive,
    status: u.status ?? (isActive ? 'active' : 'inactive'),
    user_id: u.user_id,
    user_ref_id: u.user_ref_id,
    role_id: u.role_id,
    phoneNumber: phone,
    phone_number: phone,
    createdAt: u.createdAt,
  };
}

// ---- Admin: Users ----
export const USER_BASE_URL = '/user';

export const usersApi = {
  getAllUsers: async (params: ListParams = {}): Promise<PaginatedResponse<User>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    const query = `?${sp.toString()}`;

    const res = await request<ApiPaginatedResponse<User>>(`/user/getAllUsers${query}`);
    const data = res?.response?.data?.[0];
    if (!data) {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: String(page),
        items: [],
        total: 0,
        page,
        pageSize,
      };
    }
    const rawRows = data.row || [];
    const normalizedRows = rawRows.map(normalizeUser);
    const totalItem = Number(data.totalItem) || normalizedRows.length;
    const totalPage = Number(data.totalPage) || Math.max(1, Math.ceil(totalItem / pageSize));
    const currentPage = String(data.currentPage ?? page);

    return {
      totalItem,
      totalPage,
      row: normalizedRows,
      currentPage,
      items: normalizedRows,
      total: totalItem,
      page: Number(currentPage) || page,
      pageSize,
    };
  },
  list: (params: ListParams = {}) => usersApi.getAllUsers(params),
  get: (id: string) => request<User>(`${USER_BASE_URL}/${id}`),
  create: async (body: UserCreateInput | UserUpdateInput): Promise<User> => {
    try {
      return await request<User>('/user/createUser', { method: 'POST', body: JSON.stringify(body) });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        return await request<User>(USER_BASE_URL, { method: 'POST', body: JSON.stringify(body) });
      }
      throw err;
    }
  },
  update: async (payload: UserUpdateInput | string, body?: UserUpdateInput): Promise<User> => {
    const data = typeof payload === 'string' ? { ...body, user_ref_id: payload } : payload;
    return usersApi.create(data as UserUpdateInput);
  },
  remove: async (payload: UserDeleteInput | string): Promise<void> => {
    const user_ref_id = typeof payload === 'string' ? payload : payload.user_ref_id;
    return request<void>('/user/deleteUser', {
      method: 'POST',
      body: JSON.stringify({ user_ref_id }),
    });
  },

  // Named aliases
  getUsers: (params: ListParams = {}) => usersApi.getAllUsers(params),
  getUserById: (id: string) => usersApi.get(id),
  createUser: (body: UserCreateInput | UserUpdateInput) => usersApi.create(body),
  updateUser: (payload: UserUpdateInput | string, body?: UserUpdateInput) => usersApi.update(payload, body),
  deleteUser: (payload: UserDeleteInput | string) => usersApi.remove(payload),
};
