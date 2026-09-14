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

export type SessionStatus = 'draft' | 'active' | 'published' | 'archived' | string;

export interface Session {
  sessionMasterId: number;
  sessionRefId: string;
  sessionCode: string;
  sessionName: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  // Compatibility fields for existing modules
  id: string;
  name: string;
  date: string;
}

export interface SessionCreateInput {
  sessionRefId?: string;
  name: string;
  description?: string | null;
  date: string;
  status: string;
}

export type SessionUpdateInput = Partial<SessionCreateInput> & {
  sessionRefId?: string;
};

export interface SessionDeleteInput {
  sessionRefId: string;
}

export type BucketProvider = 's3' | 'gcs' | 'azure' | 'other';

export interface Bucket {
  bucketId: number;
  bucketRefId: string;
  bucketName: string;
  serviceUrl: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  // Optional compatibility fields for existing modules
  id?: string;
  name?: string;
  provider?: BucketProvider;
  url?: string;
  config?: Record<string, string> | null;
}

export interface BucketCreateInput {
  bucketRefId: string;
  bucketName: string;
  serviceUrl: string;
  status: number;
}

export interface BucketUpdateInput {
  bucketRefId: string;
  bucketName: string;
  serviceUrl: string;
  status: number;
}

export interface BucketDeleteInput {
  bucketRefId: string;
}

export interface Video {
  videoId: number;
  videoRefId: string;

  title: string;
  filename: string;
  url: string;

  sessionId: string;
  bucketId: string;

  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;

  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;

  // Compatibility fields for existing modules
  id: string;
  signedUrl?: string;
  durationSec?: number;
}

export interface VideoCreateInput {
  videoRefId?: string;
  title: string;
  filename: string;
  url: string;
  sessionId: string;
  bucketId: string;
}

export type VideoUpdateInput = Partial<VideoCreateInput> & {
  videoRefId?: string;
};

export interface VideoDeleteInput {
  videoRefId: string;
}

export interface UserSessionMapping {
  userSessionId: number;
  userSessionRefId: string;

  userId: number | string;
  sessionId: string;

  status: number;

  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;

  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;

  // Compatibility fields for existing UI views
  id: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'user_id'>;
  session?: Pick<Session, 'id' | 'name' | 'date' | 'sessionRefId' | 'sessionName'>;
}

export interface UserSessionMappingCreateInput {
  userSessionRefId?: string;
  userId: string | number;
  sessionId: string;
}

export interface UserSessionMappingUpdateInput {
  userSessionRefId: string;
  userId: string | number;
  sessionId: string;
}

export interface UserSessionMappingDeleteInput {
  userSessionRefId: string;
}

export interface UserSessionMappingInput {
  userSessionRefId?: string;
  userId: string | number;
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

export interface ApiResponse<T> {
  statusCode: number;
  response: {
    code: string;
    data: PaginatedResponse<T>[];
  };
}

export type ApiPaginatedResponse<T> = ApiResponse<T>;

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
