// Shared API types — all request/response payloads for the coding class platform.

export type Role = 'admin' | 'user';

export type UserFormMode = 'create' | 'edit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  password?: string;
  is_active: boolean;
  createdAt?: string;
  user_id?: number;
  user_ref_id?: string;
  status?: string;
  role_id?: number;
  phoneNumber?: string;
  phone_number?: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  phone_number?: string;
  user_ref_id: string;
  is_active?: boolean;
  role?: Role;
  avatarUrl?: string;
  createdAt?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  phone_number?: string;
  user_ref_id: string;
  is_active?: boolean;
  role?: Role;
  avatarUrl?: string;
}

export interface UserDeleteInput {
  user_ref_id: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface ApiLoginResponse {
  statusCode: number;
  response: {
    code: string;
    data: Array<{
      token: string;
    }>;
  };
}

export interface ApiErrorResponse {
  statusCode?: number;
  response?: {
    code?: string | string[];
    message?: string;
    name?: string;
    stack?: string;
  };
  message?: string;
}

export interface ClientLabelItem {
  message: string;
  type: string;
}

export interface ClientLabelResponse {
  statusCode: number;
  response: {
    code?: string;
    data: Record<string, ClientLabelItem>;
  };
}

export type SessionStatus = 'draft' | 'published' | 'archived';

export interface Session {
  id: string;
  name: string;
  description: string;
  date: string; // ISO
  status: SessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionCreateInput {
  name: string;
  description: string;
  date: string;
  status: SessionStatus;
}

export type SessionUpdateInput = Partial<SessionCreateInput>;

export type BucketProvider = 's3' | 'gcs' | 'azure' | 'other';

export interface Bucket {
  id: string;
  name: string;
  provider: BucketProvider;
  url: string;
  config?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BucketCreateInput {
  name: string;
  provider: BucketProvider;
  url: string;
  config?: Record<string, string> | null;
}

export type BucketUpdateInput = Partial<BucketCreateInput>;

export interface Video {
  id: string;
  title: string;
  filename?: string;
  url: string; // direct URL or signed URL returned by backend
  signedUrl?: string; // time-limited playback URL
  durationSec?: number;
  sessionId: string;
  bucketId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoCreateInput {
  title: string;
  filename?: string;
  url: string;
  sessionId: string;
  bucketId?: string;
}

export type VideoUpdateInput = Partial<VideoCreateInput>;

export interface UserSessionMapping {
  id: string;
  userId: string;
  sessionId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  session?: Pick<Session, 'id' | 'name' | 'date'>;
  createdAt?: string;
}

export interface UserSessionMappingInput {
  userId: string;
  sessionId: string;
}

export interface PaginatedResponse<T> {
  totalItem: number;
  totalPage: number;
  row: T[];
  currentPage: string;
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiPaginatedResponse<T> {
  statusCode: number;
  response: {
    code: string;
    data: Array<PaginatedResponse<T>>;
  };
}

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
