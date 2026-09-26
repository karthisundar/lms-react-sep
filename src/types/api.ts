// Shared API types — all request/response payloads for the coding class platform.

export const ADMIN_ROLE_ID = 1;
export const USER_ROLE_ID = 2;

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
  name?: string;
  signedUrl?: string;
  duration?: number;
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
  status?: number | string;
}

export interface UserSessionMappingUpdateInput {
  userSessionRefId: string;
  userId: string | number;
  sessionId: string;
  status?: number | string;
}

export interface UserSessionMappingDeleteInput {
  userSessionRefId: string;
}

export interface UserSessionMappingInput {
  userSessionRefId?: string;
  userId: string | number;
  sessionId: string;
  status?: number | string;
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
  status?: string;
  sessionId?: string;
  sessionRefId?: string;
  courseRefId?: string;
  moduleRefId?: string;
  lessonRefId?: string;
  videoRefId?: string;
  lessonVideoMappingRefId?: string;
  lessonId?: number | string;
  lessonNotesRefId?: string;
  userId?: number | string;
  userLessonRefId?: string;
  page?: number;
  pageSize?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface VideoProgress {
  videoRefId: string;
  videoId?: number;
  lastWatchedDuration: number;
  videoDuration: number;
  isCompleted: boolean;
}

export interface VideoProgressCreateInput {
  videoRefId: string;
  lastWatchedDuration: number;
  videoDuration: number;
  isCompleted?: boolean;
}

export interface VideoProgressApiResponse {
  statusCode: number;
  response: {
    code?: string;
    data: VideoProgress[];
  };
}

export type CourseStatus = 'draft' | 'published' | 'active' | 'inactive' | string;

export interface Course {
  courseId: number;
  courseRefId: string;
  courseCode?: string;
  courseName: string;
  description: string | null;
  status: CourseStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  // Compatibility helpers
  id: string;
  name: string;
}

export interface CourseCreateInput {
  courseRefId?: string;
  courseName: string;
  description?: string;
  status?: CourseStatus;
}

export interface CourseUpdateInput {
  courseRefId: string;
  courseName: string;
  description?: string;
  status?: CourseStatus;
}

export interface CourseDeleteInput {
  courseRefId: string;
}

// Module Master Types
export type ModuleStatus = 'draft' | 'published' | 'active' | 'inactive' | string;

export interface ModuleItem {
  moduleId?: number;
  moduleRefId: string;
  courseRefId: string;
  courseName?: string;
  moduleCode?: string;
  moduleName: string;
  description?: string | null;
  displayOrder: number;
  status: ModuleStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  // Compatibility helpers
  id: string;
  name: string;
}

export type Module = ModuleItem;

export interface ModuleCreateInput {
  moduleRefId?: string;
  courseRefId: string;
  moduleName: string;
  description?: string;
  displayOrder: number;
  status?: ModuleStatus;
}

export interface ModuleUpdateInput {
  moduleRefId: string;
  courseRefId: string;
  moduleName: string;
  description?: string;
  displayOrder: number;
  status?: ModuleStatus;
}

export interface ModuleDeleteInput {
  moduleRefId: string;
}

// Lesson Master Types
export type LessonStatus = 'draft' | 'published' | 'active' | 'inactive' | string;

export interface LessonItem {
  lessonId?: number;
  lessonRefId: string;
  moduleRefId: string;
  moduleName?: string;
  lessonCode?: string;
  lessonName: string;
  description?: string | null;
  videoRefId?: string | null;
  videoTitle?: string;
  notes?: string | null;
  displayOrder: number;
  status: LessonStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  // Compatibility helpers
  id: string;
  name: string;
}

export type Lesson = LessonItem;

export interface LessonCreateInput {
  lessonRefId?: string;
  moduleRefId: string;
  lessonName: string;
  description?: string;
  videoRefId?: string | null;
  notes?: string;
  displayOrder: number;
  status?: LessonStatus;
}

export interface LessonUpdateInput {
  lessonRefId: string;
  moduleRefId: string;
  lessonName: string;
  description?: string;
  videoRefId?: string | null;
  notes?: string;
  displayOrder: number;
  status?: LessonStatus;
}

export interface LessonDeleteInput {
  lessonRefId: string;
}

// Lesson Video Mapping Types
export type LessonVideoMappingStatus = 'active' | 'inactive' | 'draft' | 'published' | string;

export interface LessonVideoMapping {
  lessonVideoMappingId?: number;
  lessonVideoMappingRefId: string;
  lessonRefId: string;
  videoRefId: string;
  displayOrder: number;
  status: LessonVideoMappingStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  // Compatibility helpers
  id: string;
  lessonName?: string;
  videoTitle?: string;
  lesson?: Partial<Lesson>;
  video?: Partial<Video>;
}

export interface LessonVideoMappingCreateInput {
  lessonVideoMappingRefId?: string;
  lessonRefId: string;
  videoRefId: string;
  displayOrder: number;
  status?: LessonVideoMappingStatus;
}

export interface LessonVideoMappingUpdateInput {
  lessonVideoMappingRefId: string;
  lessonRefId: string;
  videoRefId: string;
  displayOrder: number;
  status?: LessonVideoMappingStatus;
}

export interface LessonVideoMappingDeleteInput {
  lessonVideoMappingRefId: string;
}

// Lesson Notes Types
export type LessonNotesStatus = number | string;

export interface LessonNotes {
  lessonNotesId?: number;
  lessonNotesRefId: string;
  lessonId: number | string;
  title: string;
  content: string;
  status: LessonNotesStatus;
  documentUrl?: string | null;
  fileName?: string | null;
  filename?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  // UI helpers
  id: string;
  lessonName?: string;
  lesson?: Partial<Lesson>;
}

export interface LessonNotesCreateInput {
  lessonNotesRefId?: string;
  lessonId: number | string;
  title: string;
  content: string;
  status?: LessonNotesStatus;
  file?: File | null;
  documentUrl?: string | null;
  fileName?: string | null;
  filename?: string | null;
}

export interface LessonNotesUpdateInput {
  lessonNotesRefId: string;
  lessonId: number | string;
  title: string;
  content: string;
  status?: LessonNotesStatus;
  file?: File | null;
  documentUrl?: string | null;
  fileName?: string | null;
  filename?: string | null;
}

export interface LessonNotesDeleteInput {
  lessonNotesRefId: string;
}


// User Lesson Mapping Types
export type UserLessonMappingStatus = number | string;

export interface UserLessonMapping {
  userLessonId?: number;
  userLessonRefId: string;
  userId: number | string;
  lessonId: number | string;
  status: UserLessonMappingStatus;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;

  // Compatibility & UI fields
  id: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'user_id'>;
  lesson?: Partial<Lesson>;
  userName?: string;
  userEmail?: string;
  lessonName?: string;
}

export interface UserLessonMappingCreateInput {
  userLessonRefId?: string;
  userId: number | string;
  lessonId: number | string;
  status?: UserLessonMappingStatus;
}

export interface UserLessonMappingUpdateInput {
  userLessonRefId: string;
  userId: number | string;
  lessonId: number | string;
  status?: UserLessonMappingStatus;
}

export interface UserLessonMappingDeleteInput {
  userLessonRefId: string;
}
