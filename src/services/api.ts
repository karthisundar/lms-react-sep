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
  Course,
  CourseCreateInput,
  CourseDeleteInput,
  CourseUpdateInput,
  Lesson,
  LessonCreateInput,
  LessonDeleteInput,
  LessonStatus,
  LessonUpdateInput,
  LessonVideoMapping,
  LessonVideoMappingCreateInput,
  LessonVideoMappingDeleteInput,
  LessonVideoMappingStatus,
  LessonVideoMappingUpdateInput,
  LessonNotes,
  LessonNotesCreateInput,
  LessonNotesDeleteInput,
  LessonNotesStatus,
  LessonNotesUpdateInput,
  ListParams,
  Module,
  ModuleCreateInput,
  ModuleDeleteInput,
  ModuleStatus,
  ModuleUpdateInput,
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
  UserLessonMapping,
  UserLessonMappingCreateInput,
  UserLessonMappingDeleteInput,
  UserLessonMappingStatus,
  UserLessonMappingUpdateInput,
  UserUpdateInput,
  Video,
  VideoCreateInput,
  VideoDeleteInput,
  VideoProgress,
  VideoProgressApiResponse,
  VideoProgressCreateInput,
  VideoUpdateInput,
} from '@/types/api';
import { ADMIN_ROLE_ID, USER_ROLE_ID } from '@/types/api';

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
  const data = (decoded.user || decoded.data || decoded) as Record<string, any>;

  const id =
    data.id ||
    data.userId ||
    data.user_id ||
    data._id ||
    data.sub ||
    data.user_ref_id ||
    data.userRefId ||
    (decoded as any).user_ref_id ||
    (decoded as any).userRefId ||
    'u-default';
  const email = data.email || (decoded as any).email || '';
  const name =
    data.name ||
    data.username ||
    data.userName ||
    (decoded as any).name ||
    (email ? email.split('@')[0] : 'User');

  let role: Role = 'user';
  const rawRole =
    data.role ??
    data.roles ??
    data.roleName ??
    (decoded as any).role ??
    (data.isAdmin ? 'admin' : undefined);
  if (typeof rawRole === 'string') {
    role = rawRole.toLowerCase().includes('admin') ? 'admin' : 'user';
  } else if (Array.isArray(rawRole)) {
    role = rawRole.some((r: string) => String(r).toLowerCase().includes('admin')) ? 'admin' : 'user';
  }

  const rawUserRef =
    data.user_ref_id ||
    data.userRefId ||
    (decoded as any).user_ref_id ||
    (decoded as any).userRefId ||
    (typeof id === 'string' && (id.includes('-') || isNaN(Number(id))) ? id : '');
  const userRefId = rawUserRef ? String(rawUserRef).trim() : undefined;
  const phoneNumber = String(
    data.phoneNumber ||
    data.phone_number ||
    data.phone ||
    (decoded as any).phoneNumber ||
    (decoded as any).phone_number ||
    ''
  ).trim();

  return {
    id: String(id),
    name: String(name),
    email: String(email),
    role,
    avatarUrl: data.avatarUrl || (decoded as any).avatarUrl || '',
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    createdAt: data.createdAt || (decoded as any).createdAt,
    user_ref_id: userRefId,
    phoneNumber,
    phone_number: phoneNumber,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }
  const token = localStorage.getItem('access_token') || getToken();
  if (headers['Authorization'] && !headers['Authorization'].startsWith('Bearer ')) {
    headers['Authorization'] = `${headers['Authorization']}`;
  } else if (token && !headers['Authorization']) {
    headers['Authorization'] = token;//token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

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
  const text = await res.text();
  if (!text || !text.trim()) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
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
  get: async (explicitUserRefId?: string): Promise<User> => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('cc_token') || getToken();
    const tokenUser = token ? getUserFromToken(token) : null;
    const targetUserRefId = explicitUserRefId || tokenUser?.user_ref_id;

    // 1. If explicitUserRefId is specified, fetch that specific user's details
    if (explicitUserRefId) {
      try {
        const res = await request<any>(`/user/getUser?userRefId=${encodeURIComponent(explicitUserRefId)}`);
        const item = res?.response?.data?.[0] || res?.data || res;
        if (item && (item.name || item.email)) {
          return normalizeUser(item);
        }
      } catch {}
      try {
        const res = await request<any>(`/user/getUser?user_ref_id=${encodeURIComponent(explicitUserRefId)}`);
        const item = res?.response?.data?.[0] || res?.data || res;
        if (item && (item.name || item.email)) {
          return normalizeUser(item);
        }
      } catch {}
      try {
        const res = await request<User>(`/user/${encodeURIComponent(explicitUserRefId)}`);
        if (res && (res.name || res.email)) {
          return normalizeUser(res);
        }
      } catch {}
    }

    // 2. Normal logged-in user profile flow:
    // First try /user/me
    try {
      const res = await request<User>('/user/me');
      if (res && (res.name || res.email)) {
        return {
          ...normalizeUser(res),
          user_ref_id: res.user_ref_id || tokenUser?.user_ref_id,
          phoneNumber: res.phoneNumber || res.phone_number || tokenUser?.phoneNumber || '',
          phone_number: res.phoneNumber || res.phone_number || tokenUser?.phone_number || '',
        };
      }
    } catch {}

    // Next try /user/getUser with logged-in user's user_ref_id from JWT
    if (targetUserRefId) {
      try {
        const res = await request<any>(`/user/getUser?userRefId=${encodeURIComponent(targetUserRefId)}`);
        const item = res?.response?.data?.[0] || res?.data || res;
        if (item && (item.name || item.email)) {
          const norm = normalizeUser(item);
          return {
            ...norm,
            user_ref_id: norm.user_ref_id || targetUserRefId,
            phoneNumber: norm.phoneNumber || tokenUser?.phoneNumber || '',
            phone_number: norm.phoneNumber || tokenUser?.phone_number || '',
          };
        }
      } catch {}

      try {
        const res = await request<any>(`/user/getUser?user_ref_id=${encodeURIComponent(targetUserRefId)}`);
        const item = res?.response?.data?.[0] || res?.data || res;
        if (item && (item.name || item.email)) {
          const norm = normalizeUser(item);
          return {
            ...norm,
            user_ref_id: norm.user_ref_id || targetUserRefId,
            phoneNumber: norm.phoneNumber || tokenUser?.phoneNumber || '',
            phone_number: norm.phoneNumber || tokenUser?.phone_number || '',
          };
        }
      } catch {}
    }

    // Next try /profile
    try {
      const res = await request<User>('/profile');
      if (res && (res.name || res.email)) {
        return {
          ...normalizeUser(res),
          user_ref_id: res.user_ref_id || targetUserRefId || tokenUser?.user_ref_id,
          phoneNumber: res.phoneNumber || res.phone_number || tokenUser?.phoneNumber || '',
          phone_number: res.phoneNumber || res.phone_number || tokenUser?.phone_number || '',
        };
      }
    } catch {}

    // Fallback: stored user (ONLY if matching the current logged-in JWT identity) or tokenUser
    const stored = getStoredUser();
    if (stored && tokenUser && (stored.user_ref_id === tokenUser.user_ref_id || stored.email === tokenUser.email)) {
      return stored;
    }
    if (tokenUser) return tokenUser;
    throw new Error('Failed to load profile');
  },
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
    if (params.status && params.status !== 'all') sp.set('status', params.status);
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
  const videoId = Number(v.videoId ?? v.video_id ?? v.id ?? 0);
  const videoRefId = String(v.videoRefId ?? v.video_ref_id ?? (videoId ? String(videoId) : '') ?? v.id ?? '');
  const title = String(v.title ?? v.name ?? '');
  const filename = String(v.filename ?? '');
  const url = String(v.url ?? v.signedUrl ?? v.signed_url ?? '');
  const sessionId = String(v.sessionId ?? v.session_id ?? v.sessionRefId ?? v.session_ref_id ?? '');
  const bucketId = String(v.bucketId ?? v.bucket_id ?? '');

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
    name: title,
    signedUrl: typeof v.signedUrl === 'string' ? v.signedUrl : (typeof v.signed_url === 'string' ? v.signed_url : undefined),
    duration: typeof v.duration === 'number' ? v.duration : (typeof v.durationSec === 'number' ? v.durationSec : (typeof v.duration_sec === 'number' ? v.duration_sec : undefined)),
    durationSec: typeof v.durationSec === 'number' ? v.durationSec : (typeof v.duration === 'number' ? v.duration : (typeof v.duration_sec === 'number' ? v.duration_sec : undefined)),
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
    if (params.sessionId) sp.set('sessionId', params.sessionId);
    if (params.sessionRefId) sp.set('sessionRefId', params.sessionRefId);
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

  getVideoProgress: async (videoRefId: string): Promise<VideoProgress | null> => {
    const rawToken = localStorage.getItem('access_token') || localStorage.getItem('cc_token') || getToken();
    const headers: Record<string, string> = {};
    if (rawToken) {
      headers['Authorization'] = rawToken;
    }

    try {
      const res = await request<VideoProgressApiResponse | Record<string, any>>(
        `${VIDEO_MASTER_BASE_URL}/getVideoProgress?videoRefId=${encodeURIComponent(videoRefId)}`,
        {
          method: 'GET',
          headers,
        }
      );

      const responseObj = (res || {}) as Record<string, any>;
      const innerResponse = responseObj.response;
      const rawData =
        innerResponse?.data ??
        responseObj.data ??
        responseObj.row ??
        responseObj.rows ??
        responseObj.items ??
        responseObj.result ??
        (responseObj.videoRefId || responseObj.lastWatchedDuration !== undefined || responseObj.last_watched_duration !== undefined
          ? responseObj
          : null);
      const item = Array.isArray(rawData) ? rawData[0] : rawData;

      if (item && typeof item === 'object') {
        const rawLastWatched =
          item.lastWatchedDuration ??
          item.last_watched_duration ??
          item.watchedDuration ??
          item.watched_duration;
        const rawVideoDur =
          item.videoDuration ??
          item.video_duration ??
          item.totalDuration ??
          item.duration;
        return {
          videoRefId: String(item.videoRefId ?? item.video_ref_id ?? videoRefId),
          videoId: item.videoId !== undefined ? Number(item.videoId) : (item.video_id !== undefined ? Number(item.video_id) : undefined),
          lastWatchedDuration: Number(rawLastWatched ?? 0) || 0,
          videoDuration: Number(rawVideoDur ?? 0) || 0,
          isCompleted: Boolean(item.isCompleted ?? item.is_completed ?? false),
        };
      }
      return null;
    } catch (err) {
      console.warn('getVideoProgress error:', err);
      return null;
    }
  },

  createVideoProgress: async (body: VideoProgressCreateInput): Promise<void> => {
    const rawToken = localStorage.getItem('access_token') || localStorage.getItem('cc_token') || getToken();
    const headers: Record<string, string> = {};
    if (rawToken) {
      headers['Authorization'] = rawToken;
    }

    const payload: Record<string, unknown> = {
      videoRefId: body.videoRefId,
      lastWatchedDuration: Number(body.lastWatchedDuration),
      videoDuration: Number(body.videoDuration),
    };
    if (typeof body.isCompleted === 'boolean') {
      payload.isCompleted = body.isCompleted;
    }

    try {
      const response = await request<unknown>(`${VIDEO_MASTER_BASE_URL}/createVideoProgress`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      return response as void;
    } catch (error) {
      console.error("[VIDEO PROGRESS] createVideoProgress HTTP error:", error);
      throw error;
    }
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

// ---- Student Sessions & Video Access ----
export const studentApi = {
  mySessions: async (params: ListParams = {}): Promise<PaginatedResponse<Session>> => {
    try {
      const mappingRes = await userSessionMappingApi.getAllUserSessionMappings(params);
      const mappings = mappingRes.row || [];
      const sessionsList: Session[] = [];
      for (const m of mappings) {
        if (m.session && (m.session.name || (m.session as any).sessionName)) {
          sessionsList.push({
            sessionMasterId: 0,
            sessionRefId: m.sessionId,
            sessionCode: '',
            sessionName: (m.session as any).sessionName || m.session.name || '',
            name: (m.session as any).sessionName || m.session.name || '',
            description: (m.session as any).description || null,
            startDate: m.session.date || (m.session as any).startDate || null,
            endDate: null,
            date: m.session.date || (m.session as any).startDate || '',
            status: (m.session as any).status || (m.status === 1 ? 'active' : 'draft'),
            id: m.sessionId,
          });
        } else if (m.sessionId) {
          try {
            const s = await sessionMasterApi.getSession(m.sessionId);
            if (s) sessionsList.push(s);
          } catch {
            sessionsList.push({
              sessionMasterId: 0,
              sessionRefId: m.sessionId,
              sessionCode: '',
              sessionName: `Session (${m.sessionId.slice(0, 8)}…)`,
              name: `Session (${m.sessionId.slice(0, 8)}…)`,
              description: null,
              startDate: m.createdAt || null,
              endDate: null,
              status: m.status === 1 ? 'active' : 'draft',
              id: m.sessionId,
              date: m.createdAt || '',
            });
          }
        }
      }
      return {
        totalItem: mappingRes.totalItem,
        totalPage: mappingRes.totalPage,
        row: sessionsList,
        currentPage: mappingRes.currentPage,
        items: sessionsList,
        total: mappingRes.totalItem,
        page: mappingRes.page,
        pageSize: mappingRes.pageSize,
      };
    } catch {
      return {
        totalItem: 0,
        totalPage: 1,
        row: [],
        currentPage: '1',
        items: [],
        total: 0,
        page: 1,
        pageSize: params.pageSize ?? 10,
      };
    }
  },
  session: (sessionRefId: string) => sessionMasterApi.getSession(sessionRefId),
  videoForSession: async (sessionId: string): Promise<Video> => {
    const res = await videoMasterApi.getAllVideos({ sessionId, pageSize: 100 });
    const v = (res.row || res.items || [])[0];
    if (!v) throw Object.assign(new Error('No video found for this session'), { status: 404 });
    return v;
  },
};

export function normalizeUser(u: Record<string, any>): User {
  const id = String(u.user_id ?? u.id ?? u.user_ref_id ?? u.userRefId ?? '');
  const roleStr = String(u.role ?? (u.role_id === ADMIN_ROLE_ID ? 'admin' : 'user')).toLowerCase();
  const role: Role = roleStr.includes('admin') ? 'admin' : 'user';
  const isActive =
    u.status !== undefined
      ? u.status === 'active'
      : u.is_active !== undefined
        ? Boolean(u.is_active)
        : true;

  const phone = String(u.phoneNumber ?? u.phone_number ?? u.phone ?? '');
  const userRefId = u.user_ref_id || u.userRefId || (typeof id === 'string' && (id.includes('-') || isNaN(Number(id))) ? id : undefined);

  return {
    id,
    name: u.name ?? u.userName ?? u.username ?? '',
    email: u.email ?? '',
    role,
    avatarUrl: u.avatarUrl ?? '',
    is_active: isActive,
    status: u.status ?? (isActive ? 'active' : 'inactive'),
    user_id: u.user_id,
    user_ref_id: userRefId,
    role_id: u.role_id ?? (role === 'admin' ? ADMIN_ROLE_ID : USER_ROLE_ID),
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
  get: async (id: string): Promise<User> => {
    try {
      return await request<User>(`${USER_BASE_URL}/${id}`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
        try {
          const res = await request<any>(`${USER_BASE_URL}/getUser?userRefId=${encodeURIComponent(id)}`);
          const item = res?.response?.data?.[0] || res?.data || res;
          if (item) return normalizeUser(item);
        } catch {}
      }
      throw err;
    }
  },
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

export function normalizeCourse(c: Record<string, any>): Course {
  const courseId = Number(c.courseId ?? c.id ?? 0);
  const courseRefId = String(c.courseRefId ?? c.id ?? '');
  const courseCode = c.courseCode ? String(c.courseCode) : undefined;
  const courseName = String(c.courseName ?? c.name ?? '');
  const description = c.description !== undefined && c.description !== null ? String(c.description) : null;
  const status = String(c.status ?? 'draft');

  return {
    courseId,
    courseRefId,
    courseCode,
    courseName,
    description,
    status,
    createdAt: typeof c.createdAt === 'string' ? c.createdAt : undefined,
    updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : null,
    deletedAt: typeof c.deletedAt === 'string' ? c.deletedAt : null,
    createdBy: typeof c.createdBy === 'number' ? c.createdBy : null,
    updatedBy: typeof c.updatedBy === 'number' ? c.updatedBy : null,
    deletedBy: typeof c.deletedBy === 'number' ? c.deletedBy : null,
    // Compatibility helpers
    id: courseRefId || String(courseId),
    name: courseName,
  };
}

// ---- Admin: Course Master ----
export const COURSE_BASE_URL = '/course';

export const courseMasterApi = {
  getAllCourses: async (params: ListParams = {}): Promise<PaginatedResponse<Course>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Course>>(`${COURSE_BASE_URL}/getAllCourses${query}`);
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
    const normalizedRows = rawRows.map(normalizeCourse);
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

  getCourse: async (courseRefId: string): Promise<Course> => {
    const res = await request<ApiResponse<Course> | Record<string, unknown>>(
      `${COURSE_BASE_URL}/getCourse?courseRefId=${encodeURIComponent(courseRefId)}`
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
    return normalizeCourse(raw);
  },

  createCourse: async (body: CourseCreateInput | CourseUpdateInput): Promise<Course> => {
    const isEdit = Boolean(body.courseRefId && String(body.courseRefId).trim());
    const payload: Record<string, unknown> = {
      courseName: (body.courseName ?? '').trim(),
      description: body.description?.trim() ?? '',
      status: body.status ?? 'draft',
    };
    if (isEdit) {
      payload.courseRefId = body.courseRefId;
    }

    const res = await request<ApiResponse<Course> | Record<string, unknown>>(`${COURSE_BASE_URL}/createCourse`, {
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
    return normalizeCourse(raw);
  },

  deleteCourse: async (payload: CourseDeleteInput | string): Promise<void> => {
    const courseRefId = typeof payload === 'string' ? payload : payload.courseRefId;
    return request<void>(`${COURSE_BASE_URL}/deleteCourse`, {
      method: 'POST',
      body: JSON.stringify({ courseRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => courseMasterApi.getAllCourses(params),
  get: (courseRefId: string) => courseMasterApi.getCourse(courseRefId),
  create: (body: CourseCreateInput | CourseUpdateInput) => courseMasterApi.createCourse(body),
  update: (idOrBody: string | CourseUpdateInput, body?: CourseUpdateInput) => {
    if (typeof idOrBody === 'string') {
      return courseMasterApi.createCourse({ ...(body || {}), courseRefId: idOrBody, courseName: body?.courseName || '' });
    }
    return courseMasterApi.createCourse(idOrBody);
  },
  remove: (payload: CourseDeleteInput | string) => courseMasterApi.deleteCourse(payload),
};

export const coursesApi = courseMasterApi;

// ---- Admin: Module Master ----
export const MODULE_BASE_URL = '/module';

export function normalizeModule(m: Record<string, any>): Module {
  const moduleId = Number(m.moduleId ?? m.id ?? 0);
  const moduleRefId = String(m.moduleRefId ?? m.id ?? '');
  const courseRefId = String(m.courseRefId ?? '');
  const courseName = typeof m.courseName === 'string' ? m.courseName : undefined;
  const moduleCode = typeof m.moduleCode === 'string' ? m.moduleCode : undefined;
  const moduleName = String(m.moduleName ?? m.name ?? '');
  const description = typeof m.description === 'string' ? m.description : null;
  const displayOrder = Number(m.displayOrder ?? 1);
  const status = (m.status as ModuleStatus) ?? 'draft';

  return {
    moduleId,
    moduleRefId,
    courseRefId,
    courseName,
    moduleCode,
    moduleName,
    description,
    displayOrder,
    status,
    createdBy: typeof m.createdBy === 'number' ? m.createdBy : null,
    updatedBy: typeof m.updatedBy === 'number' ? m.updatedBy : null,
    deletedBy: typeof m.deletedBy === 'number' ? m.deletedBy : null,
    createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined,
    updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : null,
    deletedAt: typeof m.deletedAt === 'string' ? m.deletedAt : null,
    id: moduleRefId || String(moduleId),
    name: moduleName,
  };
}

export const moduleMasterApi = {
  getAllModules: async (params: ListParams = {}): Promise<PaginatedResponse<Module>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    if (params.courseRefId && params.courseRefId !== 'all') sp.set('courseRefId', params.courseRefId);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Module>>(`${MODULE_BASE_URL}/getAllModules${query}`);
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
    const normalizedRows = rawRows.map(normalizeModule);
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

  getModule: async (moduleRefId: string): Promise<Module> => {
    const res = await request<ApiResponse<Module> | Record<string, unknown>>(
      `${MODULE_BASE_URL}/getModule?moduleRefId=${encodeURIComponent(moduleRefId)}`
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
    return normalizeModule(raw);
  },

  createModule: async (body: ModuleCreateInput | ModuleUpdateInput): Promise<Module> => {
    const isEdit = Boolean(body.moduleRefId && String(body.moduleRefId).trim());
    const payload: Record<string, unknown> = {
      courseRefId: (body.courseRefId ?? '').trim(),
      moduleName: (body.moduleName ?? '').trim(),
      description: body.description?.trim() ?? '',
      displayOrder: Number(body.displayOrder ?? 1),
      status: body.status ?? 'draft',
    };
    if (isEdit) {
      payload.moduleRefId = body.moduleRefId;
    }

    const res = await request<ApiResponse<Module> | Record<string, unknown>>(`${MODULE_BASE_URL}/createModule`, {
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
    return normalizeModule(raw);
  },

  deleteModule: async (payload: ModuleDeleteInput | string): Promise<void> => {
    const moduleRefId = typeof payload === 'string' ? payload : payload.moduleRefId;
    return request<void>(`${MODULE_BASE_URL}/deleteModule`, {
      method: 'POST',
      body: JSON.stringify({ moduleRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => moduleMasterApi.getAllModules(params),
  get: (moduleRefId: string) => moduleMasterApi.getModule(moduleRefId),
  create: (body: ModuleCreateInput | ModuleUpdateInput) => moduleMasterApi.createModule(body),
  update: (idOrBody: string | ModuleUpdateInput, body?: ModuleUpdateInput) => {
    if (typeof idOrBody === 'string') {
      return moduleMasterApi.createModule({ ...(body || {}), moduleRefId: idOrBody, courseRefId: body?.courseRefId || '', moduleName: body?.moduleName || '', displayOrder: body?.displayOrder ?? 1 });
    }
    return moduleMasterApi.createModule(idOrBody);
  },
  remove: (payload: ModuleDeleteInput | string) => moduleMasterApi.deleteModule(payload),
};

export const modulesApi = moduleMasterApi;

// ---- Admin: Lesson Master ----
export const LESSON_BASE_URL = '/lesson';

export function normalizeLesson(l: Record<string, any>): Lesson {
  const lessonId = Number(l.lessonId ?? l.id ?? 0);
  const lessonRefId = String(l.lessonRefId ?? l.id ?? '');
  const moduleRefId = String(l.moduleRefId ?? '');
  const moduleName = typeof l.moduleName === 'string' ? l.moduleName : undefined;
  const lessonCode = typeof l.lessonCode === 'string' ? l.lessonCode : undefined;
  const lessonName = String(l.lessonName ?? l.name ?? '');
  const description = typeof l.description === 'string' ? l.description : null;
  const videoRefId = typeof l.videoRefId === 'string' && l.videoRefId.trim() ? l.videoRefId.trim() : null;
  const videoTitle = typeof l.videoTitle === 'string' ? l.videoTitle : (typeof l.video_title === 'string' ? l.video_title : undefined);
  const notes = typeof l.notes === 'string' ? l.notes : null;
  const displayOrder = Number(l.displayOrder ?? 1);
  const status = (l.status as LessonStatus) ?? 'draft';

  return {
    lessonId,
    lessonRefId,
    moduleRefId,
    moduleName,
    lessonCode,
    lessonName,
    description,
    videoRefId,
    videoTitle,
    notes,
    displayOrder,
    status,
    createdBy: typeof l.createdBy === 'number' ? l.createdBy : null,
    updatedBy: typeof l.updatedBy === 'number' ? l.updatedBy : null,
    deletedBy: typeof l.deletedBy === 'number' ? l.deletedBy : null,
    createdAt: typeof l.createdAt === 'string' ? l.createdAt : undefined,
    updatedAt: typeof l.updatedAt === 'string' ? l.updatedAt : null,
    deletedAt: typeof l.deletedAt === 'string' ? l.deletedAt : null,
    id: lessonRefId || String(lessonId),
    name: lessonName,
  };
}

export const lessonMasterApi = {
  getAllLessons: async (params: ListParams = {}): Promise<PaginatedResponse<Lesson>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    if (params.moduleRefId && params.moduleRefId !== 'all') sp.set('moduleRefId', params.moduleRefId);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<Lesson>>(`${LESSON_BASE_URL}/getAllLessons${query}`);
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
    const normalizedRows = rawRows.map(normalizeLesson);
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

  getLesson: async (lessonRefId: string): Promise<Lesson> => {
    const res = await request<ApiResponse<Lesson> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/getLesson?lessonRefId=${encodeURIComponent(lessonRefId)}`
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
    return normalizeLesson(raw);
  },

  createLesson: async (body: LessonCreateInput | LessonUpdateInput): Promise<Lesson> => {
    const isEdit = Boolean(body.lessonRefId && String(body.lessonRefId).trim());
    const payload: Record<string, unknown> = {
      moduleRefId: (body.moduleRefId ?? '').trim(),
      lessonName: (body.lessonName ?? '').trim(),
      description: body.description?.trim() ?? '',
      videoRefId: body.videoRefId && String(body.videoRefId).trim() ? String(body.videoRefId).trim() : null,
      notes: body.notes?.trim() ?? '',
      displayOrder: Number(body.displayOrder ?? 1),
      status: body.status ?? 'draft',
    };
    if (isEdit) {
      payload.lessonRefId = body.lessonRefId;
    }

    const res = await request<ApiResponse<Lesson> | Record<string, unknown>>(`${LESSON_BASE_URL}/createLesson`, {
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
    return normalizeLesson(raw);
  },

  deleteLesson: async (payload: LessonDeleteInput | string): Promise<void> => {
    const lessonRefId = typeof payload === 'string' ? payload : payload.lessonRefId;
    return request<void>(`${LESSON_BASE_URL}/deleteLesson`, {
      method: 'POST',
      body: JSON.stringify({ lessonRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => lessonMasterApi.getAllLessons(params),
  get: (lessonRefId: string) => lessonMasterApi.getLesson(lessonRefId),
  create: (body: LessonCreateInput | LessonUpdateInput) => lessonMasterApi.createLesson(body),
  update: (idOrBody: string | LessonUpdateInput, body?: LessonUpdateInput) => {
    if (typeof idOrBody === 'string') {
      return lessonMasterApi.createLesson({ ...(body || {}), lessonRefId: idOrBody, moduleRefId: body?.moduleRefId || '', lessonName: body?.lessonName || '', displayOrder: body?.displayOrder ?? 1 });
    }
    return lessonMasterApi.createLesson(idOrBody);
  },
  remove: (payload: LessonDeleteInput | string) => lessonMasterApi.deleteLesson(payload),
};

export const lessonsApi = lessonMasterApi;

// ---- Admin: Lesson Video Mapping ----
export function normalizeLessonVideoMapping(m: Record<string, any>): LessonVideoMapping {
  const lessonVideoMappingRefId = String(
    m.lessonVideoMappingRefId ??
    m.lesson_video_mapping_ref_id ??
    m.mappingRefId ??
    m.id ??
    ''
  ).trim();
  const lessonVideoMappingId = Number(m.lessonVideoMappingId ?? m.lesson_video_mapping_id ?? 0) || undefined;
  const lessonRefId = String(m.lessonRefId ?? m.lesson_ref_id ?? '').trim();
  const videoRefId = String(m.videoRefId ?? m.video_ref_id ?? '').trim();
  const displayOrder = Number(m.displayOrder ?? m.display_order ?? 1);
  const status = (m.status as LessonVideoMappingStatus) || 'draft';

  const lessonObj = (m.lesson as Record<string, any>) || {};
  const videoObj = (m.video as Record<string, any>) || {};

  const lessonName = String(m.lessonName ?? lessonObj.lessonName ?? lessonObj.name ?? '').trim();
  const videoTitle = String(m.videoTitle ?? m.title ?? videoObj.videoTitle ?? videoObj.title ?? '').trim();

  return {
    lessonVideoMappingId,
    lessonVideoMappingRefId,
    lessonRefId,
    videoRefId,
    displayOrder,
    status,
    createdBy: typeof m.createdBy === 'number' ? m.createdBy : null,
    updatedBy: typeof m.updatedBy === 'number' ? m.updatedBy : null,
    deletedBy: typeof m.deletedBy === 'number' ? m.deletedBy : null,
    createdAt: typeof m.createdAt === 'string' ? m.createdAt : undefined,
    updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : null,
    deletedAt: typeof m.deletedAt === 'string' ? m.deletedAt : null,
    id: lessonVideoMappingRefId || String(lessonVideoMappingId || ''),
    lessonName: lessonName || undefined,
    videoTitle: videoTitle || undefined,
    lesson: m.lesson as Partial<Lesson> | undefined,
    video: m.video as Partial<Video> | undefined,
  };
}

export const lessonVideoMappingApi = {
  getAllLessonVideoMappings: async (params: ListParams = {}): Promise<PaginatedResponse<LessonVideoMapping>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    if (params.lessonRefId && params.lessonRefId !== 'all') sp.set('lessonRefId', params.lessonRefId);
    if (params.videoRefId && params.videoRefId !== 'all') sp.set('videoRefId', params.videoRefId);
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<LessonVideoMapping>>(`${LESSON_BASE_URL}/getAllLessonVideoMappings${query}`);
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
    const normalizedRows = rawRows.map(normalizeLessonVideoMapping);
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

  getLessonVideoMapping: async (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> => {
    const res = await request<ApiResponse<LessonVideoMapping> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/getLessonVideoMapping?lessonVideoMappingRefId=${encodeURIComponent(lessonVideoMappingRefId)}`
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
    return normalizeLessonVideoMapping(raw);
  },

  createLessonVideoMapping: async (
    body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput
  ): Promise<LessonVideoMapping> => {
    const isEdit = Boolean(body.lessonVideoMappingRefId && String(body.lessonVideoMappingRefId).trim());
    const payload: Record<string, unknown> = {
      lessonRefId: (body.lessonRefId ?? '').trim(),
      videoRefId: (body.videoRefId ?? '').trim(),
      displayOrder: Number(body.displayOrder ?? 1),
      status: body.status ?? 'draft',
    };
    if (isEdit) {
      payload.lessonVideoMappingRefId = body.lessonVideoMappingRefId;
    }

    const res = await request<ApiResponse<LessonVideoMapping> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/createLessonVideoMapping`,
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
    return normalizeLessonVideoMapping(raw);
  },

  deleteLessonVideoMapping: async (payload: LessonVideoMappingDeleteInput | string): Promise<void> => {
    const lessonVideoMappingRefId =
      typeof payload === 'string' ? payload : payload.lessonVideoMappingRefId;
    return request<void>(`${LESSON_BASE_URL}/deleteLessonVideoMapping`, {
      method: 'POST',
      body: JSON.stringify({ lessonVideoMappingRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => lessonVideoMappingApi.getAllLessonVideoMappings(params),
  get: (lessonVideoMappingRefId: string) => lessonVideoMappingApi.getLessonVideoMapping(lessonVideoMappingRefId),
  create: (body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput) =>
    lessonVideoMappingApi.createLessonVideoMapping(body),
  update: (
    idOrBody: string | LessonVideoMappingUpdateInput,
    body?: LessonVideoMappingUpdateInput
  ) => {
    if (typeof idOrBody === 'string') {
      return lessonVideoMappingApi.createLessonVideoMapping({
        ...(body || {}),
        lessonVideoMappingRefId: idOrBody,
        lessonRefId: body?.lessonRefId || '',
        videoRefId: body?.videoRefId || '',
        displayOrder: body?.displayOrder ?? 1,
      });
    }
    return lessonVideoMappingApi.createLessonVideoMapping(idOrBody);
  },
  remove: (payload: LessonVideoMappingDeleteInput | string) =>
    lessonVideoMappingApi.deleteLessonVideoMapping(payload),
};

export const lessonVideoMappingsApi = lessonVideoMappingApi;

// ---- Admin: Lesson Notes ----
export function normalizeLessonNotes(raw: Record<string, any>): LessonNotes {
  const lessonNotesRefId = String(
    raw.lessonNotesRefId ??
    raw.lesson_notes_ref_id ??
    raw.notesRefId ??
    raw.refId ??
    raw.id ??
    ''
  ).trim();
  const lessonNotesId = Number(raw.lessonNotesId ?? raw.lesson_notes_id ?? 0) || undefined;
  const lessonId = raw.lessonId ?? raw.lesson_id ?? '';
  const title = String(raw.title ?? raw.noteTitle ?? '').trim();
  const content = String(raw.content ?? raw.notes ?? raw.description ?? '').trim();
  const status = raw.status !== undefined && raw.status !== null ? raw.status : 1;

  const lessonObj = (raw.lesson as Record<string, any>) || {};
  const lessonName = String(raw.lessonName ?? lessonObj.lessonName ?? lessonObj.name ?? '').trim();

  const documentUrl = String(
    raw.documentUrl ??
    raw.document_url ??
    raw.fileUrl ??
    raw.file_url ??
    raw.attachmentUrl ??
    raw.attachment_url ??
    raw.url ??
    ''
  ).trim() || null;

  let fileName = String(
    raw.fileName ??
    raw.filename ??
    raw.documentName ??
    raw.document_name ??
    raw.attachmentName ??
    raw.name ??
    ''
  ).trim() || null;

  if (!fileName && documentUrl) {
    try {
      const parsed = new URL(documentUrl, 'http://localhost');
      fileName = decodeURIComponent(parsed.pathname.split('/').pop() || '') || null;
    } catch {
      const parts = documentUrl.split('/');
      fileName = decodeURIComponent(parts[parts.length - 1]?.split('?')[0] || '') || null;
    }
  }

  const fileType = String(
    raw.fileType ??
    raw.file_type ??
    raw.documentType ??
    raw.document_type ??
    raw.mimeType ??
    ''
  ).trim() || null;

  const fileSize = typeof raw.fileSize === 'number'
    ? raw.fileSize
    : (typeof raw.file_size === 'number' ? raw.file_size : null);

  return {
    lessonNotesId,
    lessonNotesRefId,
    lessonId,
    title,
    content,
    status,
    documentUrl,
    fileName,
    filename: fileName,
    fileType,
    fileSize,
    createdBy: typeof raw.createdBy === 'number' ? raw.createdBy : null,
    updatedBy: typeof raw.updatedBy === 'number' ? raw.updatedBy : null,
    deletedBy: typeof raw.deletedBy === 'number' ? raw.deletedBy : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
    id: lessonNotesRefId || String(lessonNotesId || ''),
    lessonName: lessonName || undefined,
    lesson: raw.lesson as Partial<Lesson> | undefined,
  };
}

export const lessonNotesApi = {
  getAllLessonNotes: async (params: ListParams = {}): Promise<PaginatedResponse<LessonNotes>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status !== undefined && params.status !== null && params.status !== 'all') {
      sp.set('status', String(params.status));
    }
    if (params.lessonId !== undefined && params.lessonId !== null && params.lessonId !== 'all') {
      sp.set('lessonId', String(params.lessonId));
    }
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<LessonNotes>>(`${LESSON_BASE_URL}/getAllLessonNotes${query}`);
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
    const normalizedRows = rawRows.map(normalizeLessonNotes);
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

  getLessonNotes: async (lessonNotesRefId: string): Promise<LessonNotes> => {
    const res = await request<ApiResponse<LessonNotes> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/getLessonNotes?lessonNotesRefId=${encodeURIComponent(lessonNotesRefId)}`
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
    return normalizeLessonNotes(raw);
  },

  createLessonNotes: async (
    body: FormData | LessonNotesCreateInput | LessonNotesUpdateInput
  ): Promise<LessonNotes> => {
    let requestBody: BodyInit;
    let fallbackRaw: Record<string, unknown> = {};

    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      requestBody = body;
      const title = body.get('title');
      const content = body.get('content');
      const lessonId = body.get('lessonId');
      const status = body.get('status');
      const lessonNotesRefId = body.get('lessonNotesRefId');
      fallbackRaw = {
        title: title ? String(title) : '',
        content: content ? String(content) : '',
        lessonId: lessonId ? String(lessonId) : '',
        status: status ? Number(status) : 1,
        lessonNotesRefId: lessonNotesRefId ? String(lessonNotesRefId) : undefined,
      };
    } else {
      const isEdit = Boolean(body.lessonNotesRefId && String(body.lessonNotesRefId).trim());
      fallbackRaw = {
        lessonId: body.lessonId,
        title: (body.title ?? '').trim(),
        content: (body.content ?? '').trim(),
        status: body.status !== undefined && body.status !== null ? body.status : 1,
      };
      if (isEdit) {
        fallbackRaw.lessonNotesRefId = body.lessonNotesRefId;
      }

      if (body.file) {
        const fd = new FormData();
        fd.append('title', (body.title ?? '').trim());
        fd.append('content', (body.content ?? '').trim());
        fd.append('lessonId', String(body.lessonId));
        fd.append('status', String(body.status !== undefined && body.status !== null ? body.status : 1));
        if (isEdit && body.lessonNotesRefId) {
          fd.append('lessonNotesRefId', body.lessonNotesRefId);
        }
        fd.append('file', body.file);
        requestBody = fd;
      } else {
        requestBody = JSON.stringify(fallbackRaw);
      }
    }

    const res = await request<ApiResponse<LessonNotes> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/createLessonNotes`,
      {
        method: 'POST',
        body: requestBody,
      }
    );
    const responseObj = (res || {}) as Record<string, unknown>;
    const innerResponse = responseObj.response as Record<string, unknown> | undefined;
    const data = innerResponse?.data ?? responseObj.data ?? res;
    let raw: Record<string, unknown> = fallbackRaw;
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
    return normalizeLessonNotes(raw);
  },


  deleteLessonNotes: async (payload: LessonNotesDeleteInput | string): Promise<void> => {
    const lessonNotesRefId = typeof payload === 'string' ? payload : payload.lessonNotesRefId;
    return request<void>(`${LESSON_BASE_URL}/deleteLessonNotes`, {
      method: 'POST',
      body: JSON.stringify({ lessonNotesRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => lessonNotesApi.getAllLessonNotes(params),
  get: (lessonNotesRefId: string) => lessonNotesApi.getLessonNotes(lessonNotesRefId),
  create: (body: LessonNotesCreateInput | LessonNotesUpdateInput) =>
    lessonNotesApi.createLessonNotes(body),
  update: (
    idOrBody: string | LessonNotesUpdateInput,
    body?: LessonNotesUpdateInput
  ) => {
    if (typeof idOrBody === 'string') {
      return lessonNotesApi.createLessonNotes({
        ...(body || {}),
        lessonNotesRefId: idOrBody,
        lessonId: body?.lessonId ?? '',
        title: body?.title ?? '',
        content: body?.content ?? '',
        status: body?.status ?? 1,
      });
    }
    return lessonNotesApi.createLessonNotes(idOrBody);
  },
  remove: (payload: LessonNotesDeleteInput | string) =>
    lessonNotesApi.deleteLessonNotes(payload),
};

export const lessonNoteApi = lessonNotesApi;

// ---- Admin: User Lesson Mapping ----
export function normalizeUserLessonMapping(raw: Record<string, any>): UserLessonMapping {
  const userLessonRefId = String(
    raw.userLessonRefId ??
    raw.user_lesson_ref_id ??
    raw.mappingRefId ??
    raw.refId ??
    raw.id ??
    ''
  ).trim();
  const userLessonId = Number(raw.userLessonId ?? raw.user_lesson_id ?? 0) || undefined;
  const userId = raw.userId ?? raw.user_id ?? '';
  const lessonId = raw.lessonId ?? raw.lesson_id ?? '';
  const status = raw.status !== undefined && raw.status !== null ? raw.status : 1;

  const userObj = (raw.user as Record<string, any>) || {};
  const lessonObj = (raw.lesson as Record<string, any>) || {};

  const userName = String(raw.userName ?? userObj.name ?? userObj.userName ?? '').trim();
  const userEmail = String(raw.userEmail ?? userObj.email ?? '').trim();
  const lessonName = String(raw.lessonName ?? lessonObj.lessonName ?? lessonObj.name ?? '').trim();

  return {
    userLessonId,
    userLessonRefId,
    userId,
    lessonId,
    status,
    createdBy: typeof raw.createdBy === 'number' ? raw.createdBy : null,
    updatedBy: typeof raw.updatedBy === 'number' ? raw.updatedBy : null,
    deletedBy: typeof raw.deletedBy === 'number' ? raw.deletedBy : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
    id: userLessonRefId || String(userLessonId || ''),
    user: raw.user as Pick<User, 'id' | 'name' | 'email' | 'user_id'> | undefined,
    lesson: raw.lesson as Partial<Lesson> | undefined,
    userName: userName || undefined,
    userEmail: userEmail || undefined,
    lessonName: lessonName || undefined,
  };
}

export const userLessonMappingApi = {
  getAllUserLessonMappings: async (params: ListParams = {}): Promise<PaginatedResponse<UserLessonMapping>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (params.search) sp.set('search', params.search);
    if (params.status !== undefined && params.status !== null && params.status !== 'all') {
      sp.set('status', String(params.status));
    }
    if (params.userId !== undefined && params.userId !== null && params.userId !== 'all') {
      sp.set('userId', String(params.userId));
    }
    if (params.lessonId !== undefined && params.lessonId !== null && params.lessonId !== 'all') {
      sp.set('lessonId', String(params.lessonId));
    }
    const query = `?${sp.toString()}`;

    const res = await request<ApiResponse<UserLessonMapping>>(`${LESSON_BASE_URL}/getAllUserLessonMappings${query}`);
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
    const normalizedRows = rawRows.map(normalizeUserLessonMapping);
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

  getUserLessonMapping: async (userLessonRefId: string): Promise<UserLessonMapping> => {
    const res = await request<ApiResponse<UserLessonMapping> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/getUserLessonMapping?userLessonRefId=${encodeURIComponent(userLessonRefId)}`
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
    return normalizeUserLessonMapping(raw);
  },

  createUserLessonMapping: async (
    body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput
  ): Promise<UserLessonMapping> => {
    const isEdit = Boolean(body.userLessonRefId && String(body.userLessonRefId).trim());
    const payload: Record<string, unknown> = {
      userId: Number(body.userId) || body.userId,
      lessonId: body.lessonId,
      status: body.status !== undefined && body.status !== null ? Number(body.status) : 1,
    };
    if (isEdit) {
      payload.userLessonRefId = body.userLessonRefId;
    }

    const res = await request<ApiResponse<UserLessonMapping> | Record<string, unknown>>(
      `${LESSON_BASE_URL}/createUserLessonMapping`,
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
    return normalizeUserLessonMapping(raw);
  },

  deleteUserLessonMapping: async (payload: UserLessonMappingDeleteInput | string): Promise<void> => {
    const userLessonRefId = typeof payload === 'string' ? payload : payload.userLessonRefId;
    return request<void>(`${LESSON_BASE_URL}/deleteUserLessonMapping`, {
      method: 'POST',
      body: JSON.stringify({ userLessonRefId }),
    });
  },

  // Aliases conforming to standard CRUD naming
  list: (params: ListParams = {}) => userLessonMappingApi.getAllUserLessonMappings(params),
  get: (userLessonRefId: string) => userLessonMappingApi.getUserLessonMapping(userLessonRefId),
  create: (body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput) =>
    userLessonMappingApi.createUserLessonMapping(body),
  update: (
    idOrBody: string | UserLessonMappingUpdateInput,
    body?: UserLessonMappingUpdateInput
  ) => {
    if (typeof idOrBody === 'string') {
      return userLessonMappingApi.createUserLessonMapping({
        ...(body || {}),
        userLessonRefId: idOrBody,
        userId: body?.userId ?? '',
        lessonId: body?.lessonId ?? '',
        status: body?.status ?? 1,
      });
    }
    return userLessonMappingApi.createUserLessonMapping(idOrBody);
  },
  remove: (payload: UserLessonMappingDeleteInput | string) =>
    userLessonMappingApi.deleteUserLessonMapping(payload),
};

export const userLessonMappingsApi = userLessonMappingApi;





