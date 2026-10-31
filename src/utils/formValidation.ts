/**
 * Centralized Form Validation Library
 * Used across all Admin, Student, Public, and Authentication forms.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/;

export const CODE_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Normalizes email: trims and converts to lowercase.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates email format.
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates phone number format (optional allowed).
 */
export function isValidPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return true; // optional
  const trimmed = phone.trim();
  if (!trimmed) return true;
  return PHONE_REGEX.test(trimmed);
}

/**
 * Validates HTTP/HTTPS URL format.
 */
export function isValidUrl(urlStr?: string | null): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname && (u.hostname === 'localhost' || u.hostname.includes('.'));
  } catch {
    return false;
  }
}

/**
 * Validates relative path or filename without path traversal.
 */
export function isValidSafePath(p?: string | null): boolean {
  if (!p || typeof p !== 'string') return false;
  const trimmed = p.trim();
  if (!trimmed) return false;
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) {
    return false;
  }
  return true;
}

/**
 * Validates integer order / numeric value.
 */
export function isValidPositiveInteger(val: unknown): boolean {
  if (val === undefined || val === null || val === '') return false;
  const n = Number(val);
  return Number.isInteger(n) && n >= 0;
}

/**
 * Validates date string.
 */
export function isValidDateString(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Checks if a string length is within bounds.
 */
export function isLengthBetween(str: string, min: number, max: number): boolean {
  const len = str.trim().length;
  return len >= min && len <= max;
}

// ============================================================
// Entity-specific Validation Functions
// ============================================================

export interface UserValidationFields {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role?: string;
  user_ref_id?: string;
}

export function validateUserFields(
  data: UserValidationFields,
  mode: 'create' | 'edit',
  existingUsers: { email?: string; user_ref_id?: string; id?: string }[] = []
): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = (data.name || '').trim();
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Full name cannot exceed 100 characters.';
  }

  const rawEmail = (data.email || '').trim();
  const normalized = normalizeEmail(rawEmail);
  if (!rawEmail) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(rawEmail)) {
    errors.email = 'Please enter a valid email address.';
  } else {
    // Check local duplicate if existingUsers provided
    const conflict = existingUsers.find((u) => {
      const uEmail = normalizeEmail(u.email);
      const isSameUser =
        (data.user_ref_id && (u.user_ref_id === data.user_ref_id || u.id === data.user_ref_id));
      return uEmail === normalized && !isSameUser;
    });

    if (conflict) {
      errors.email = 'This email address is already registered.';
    }
  }

  const phone = (data.phoneNumber || '').trim();
  if (phone && !isValidPhone(phone)) {
    errors.phoneNumber = 'Please enter a valid phone number (e.g. +1 234 567 8900).';
  }

  if (mode === 'create') {
    const password = data.password || '';
    if (!password) {
      errors.password = 'Password is required for new users.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
  } else if (data.password && data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters if changing.';
  }

  if (data.role && !['admin', 'user', 'lecturer'].includes(data.role)) {
    errors.role = 'Please select a valid role.';
  }

  return errors;
}

export interface VideoValidationFields {
  title: string;
  filename: string;
  url: string;
  sessionId: string;
  bucketId: string;
}

export function validateVideoFields(data: VideoValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const title = (data.title || '').trim();
  if (!title) {
    errors.title = 'Video title is required.';
  } else if (title.length < 2) {
    errors.title = 'Video title must be at least 2 characters.';
  } else if (title.length > 150) {
    errors.title = 'Video title cannot exceed 150 characters.';
  }

  const filenameOrKey = (data.url || data.filename || '').trim();
  if (!filenameOrKey) {
    errors.filename = 'Filename or relative object key is required.';
  } else if (!isValidSafePath(filenameOrKey)) {
    errors.filename = 'Invalid filename: Path traversal (..) is not permitted.';
  }

  if (!data.sessionId) {
    errors.sessionId = 'Please select an associated session.';
  }

  if (!data.bucketId) {
    errors.bucketId = 'Please select an associated storage bucket.';
  }

  return errors;
}

export interface BucketValidationFields {
  bucketName: string;
  serviceUrl: string;
}

export function validateBucketFields(data: BucketValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const bucketName = (data.bucketName || '').trim();
  if (!bucketName) {
    errors.bucketName = 'Bucket name is required.';
  } else if (bucketName.length < 2) {
    errors.bucketName = 'Bucket name must be at least 2 characters.';
  } else if (bucketName.length > 100) {
    errors.bucketName = 'Bucket name cannot exceed 100 characters.';
  }

  const serviceUrl = (data.serviceUrl || '').trim();
  if (!serviceUrl) {
    errors.serviceUrl = 'Service URL / Base endpoint is required.';
  } else if (!isValidUrl(serviceUrl)) {
    errors.serviceUrl = 'Please enter a valid HTTP or HTTPS service URL.';
  }

  return errors;
}

export interface CourseValidationFields {
  courseName: string;
  courseCode?: string;
  description?: string;
}

export function validateCourseFields(data: CourseValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const courseName = (data.courseName || '').trim();
  if (!courseName) {
    errors.courseName = 'Course name is required.';
  } else if (courseName.length < 2) {
    errors.courseName = 'Course name must be at least 2 characters.';
  } else if (courseName.length > 150) {
    errors.courseName = 'Course name cannot exceed 150 characters.';
  }

  const code = (data.courseCode || '').trim();
  if (code && (code.length < 2 || code.length > 30)) {
    errors.courseCode = 'Course code must be between 2 and 30 characters.';
  }

  return errors;
}

export interface ModuleValidationFields {
  moduleName: string;
  courseId?: string;
  courseRefId?: string;
  moduleCode?: string;
  displayOrder?: unknown;
  description?: string;
}

export function validateModuleFields(data: ModuleValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const courseKey = (data.courseRefId || data.courseId || '').trim();
  if (!courseKey) {
    errors.courseRefId = 'Please select a parent course.';
    errors.courseId = 'Please select a parent course.';
  }

  const moduleName = (data.moduleName || '').trim();
  if (!moduleName) {
    errors.moduleName = 'Module name is required.';
  } else if (moduleName.length < 2) {
    errors.moduleName = 'Module name must be at least 2 characters.';
  } else if (moduleName.length > 150) {
    errors.moduleName = 'Module name cannot exceed 150 characters.';
  }

  if (data.displayOrder !== undefined && data.displayOrder !== '' && !isValidPositiveInteger(data.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  return errors;
}

export interface LessonValidationFields {
  lessonName: string;
  moduleId?: string;
  moduleRefId?: string;
  lessonCode?: string;
  displayOrder?: unknown;
  description?: string;
  notes?: string;
}

export function validateLessonFields(data: LessonValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const moduleKey = (data.moduleRefId || data.moduleId || '').trim();
  if (!moduleKey) {
    errors.moduleRefId = 'Please select a parent module.';
    errors.moduleId = 'Please select a parent module.';
  }

  const lessonName = (data.lessonName || '').trim();
  if (!lessonName) {
    errors.lessonName = 'Lesson name is required.';
  } else if (lessonName.length < 2) {
    errors.lessonName = 'Lesson name must be at least 2 characters.';
  } else if (lessonName.length > 150) {
    errors.lessonName = 'Lesson name cannot exceed 150 characters.';
  }

  if (data.displayOrder !== undefined && data.displayOrder !== '' && !isValidPositiveInteger(data.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }

  return errors;
}

export interface SessionValidationFields {
  sessionName: string;
  date?: string;
  sessionDate?: string;
  sessionCode?: string;
  description?: string;
}

export function validateSessionFields(data: SessionValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = (data.sessionName || '').trim();
  if (!name) {
    errors.sessionName = 'Session name is required.';
  } else if (name.length < 2) {
    errors.sessionName = 'Session name must be at least 2 characters.';
  } else if (name.length > 150) {
    errors.sessionName = 'Session name cannot exceed 150 characters.';
  }

  const rawDate = data.sessionDate || data.date;
  if (rawDate && !isValidDateString(rawDate)) {
    errors.sessionDate = 'Please provide a valid date.';
    errors.date = 'Please provide a valid date.';
  }

  return errors;
}

export interface MappingValidationFields {
  userId: string;
  sessionId?: string;
  lessonId?: string;
  videoId?: string;
}

export function validateUserSessionMappingFields(data: { userId: string; sessionId: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.userId) errors.userId = 'Please select a user.';
  if (!data.sessionId) errors.sessionId = 'Please select a session.';
  return errors;
}

export function validateMappingFields(data: { userId: string; targetId: string; targetLabel: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.userId) errors.userId = 'Please select a user.';
  if (!data.targetId) errors.targetId = `Please select a ${data.targetLabel.toLowerCase()}.`;
  return errors;
}

export function validateLessonVideoMappingFields(data: { lessonId: string; videoId: string; displayOrder?: unknown }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.lessonId) errors.lessonId = 'Please select a lesson.';
  if (!data.videoId) errors.videoId = 'Please select a video.';
  if (data.displayOrder !== undefined && data.displayOrder !== '' && !isValidPositiveInteger(data.displayOrder)) {
    errors.displayOrder = 'Display order must be a non-negative integer.';
  }
  return errors;
}

export interface LessonNotesValidationFields {
  lessonId: string;
  title: string;
  file?: File | null;
  hasExistingFile?: boolean;
}

export function validateLessonNotesFields(data: LessonNotesValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.lessonId) errors.lessonId = 'Please select a lesson.';

  const title = (data.title || '').trim();
  if (!title) {
    errors.title = 'Note title is required.';
  } else if (title.length < 2) {
    errors.title = 'Title must be at least 2 characters.';
  } else if (title.length > 150) {
    errors.title = 'Title cannot exceed 150 characters.';
  }

  if (!data.hasExistingFile && !data.file) {
    errors.file = 'Please upload a note file document.';
  }

  if (data.file) {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    const fileName = data.file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      errors.file = 'Allowed file formats: PDF, DOC, DOCX, XLS, XLSX, TXT.';
    }
    // 20 MB size limit
    if (data.file.size > 20 * 1024 * 1024) {
      errors.file = 'File size cannot exceed 20MB.';
    }
  }

  return errors;
}

export interface LoginValidationFields {
  email?: string;
  password?: string;
}

export function validateLoginFields(data: LoginValidationFields): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = (data.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}
