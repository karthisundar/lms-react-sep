import type {
  ApiErrorResponse,
  ApiLoginResponse,
  ApiPaginatedResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketUpdateInput,
  ClientLabelItem,
  ClientLabelResponse,
  ListParams,
  PaginatedResponse,
  Role,
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

// ---- Admin: Sessions ----
export const sessionsApi = {
  list: (params: ListParams = {}) =>
    request<PaginatedResponse<Session>>(`/sessions${withQuery(params)}`),
  get: (id: string) => request<Session>(`/sessions/${id}`),
  create: (body: SessionCreateInput) =>
    request<Session>('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: SessionUpdateInput) =>
    request<Session>(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/sessions/${id}`, { method: 'DELETE' }),
};

// ---- Admin: Buckets ----
export const bucketsApi = {
  list: (params: ListParams = {}) =>
    request<PaginatedResponse<Bucket>>(`/buckets${withQuery(params)}`),
  get: (id: string) => request<Bucket>(`/buckets/${id}`),
  create: (body: BucketCreateInput) =>
    request<Bucket>('/buckets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: BucketUpdateInput) =>
    request<Bucket>(`/buckets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/buckets/${id}`, { method: 'DELETE' }),
};

// ---- Admin: Videos ----
export const videosApi = {
  list: (params: ListParams = {}) =>
    request<PaginatedResponse<Video>>(`/videos${withQuery(params)}`),
  get: (id: string) => request<Video>(`/videos/${id}`),
  create: (body: VideoCreateInput) =>
    request<Video>('/videos', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: VideoUpdateInput) =>
    request<Video>(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/videos/${id}`, { method: 'DELETE' }),
};

// ---- Admin: User-Session Mapping ----
export const mappingsApi = {
  list: (params: ListParams = {}) =>
    request<PaginatedResponse<UserSessionMapping>>(`/mappings${withQuery(params)}`),
  create: (body: UserSessionMappingInput) =>
    request<UserSessionMapping>('/mappings', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/mappings/${id}`, { method: 'DELETE' }),
};

export function normalizeUser(u: any): any {
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
