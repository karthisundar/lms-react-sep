// Unified service: uses the real REST API when VITE_API_BASE_URL is set,
// otherwise falls back to the in-memory demo data so the UI is fully explorable.

import type {
  AuthLoginRequest,
  AuthLoginResponse,
  Bucket,
  BucketCreateInput,
  BucketDeleteInput,
  BucketUpdateInput,
  Course,
  CourseCreateInput,
  CourseDeleteInput,
  CourseUpdateInput,
  Lesson,
  LessonCreateInput,
  LessonDeleteInput,
  LessonUpdateInput,
  LessonVideoMapping,
  LessonVideoMappingCreateInput,
  LessonVideoMappingDeleteInput,
  LessonVideoMappingUpdateInput,
  LessonNotes,
  LessonNotesCreateInput,
  LessonNotesDeleteInput,
  LessonNotesUpdateInput,
  ListParams,
  Module,
  ModuleCreateInput,
  ModuleDeleteInput,
  ModuleUpdateInput,
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
  UserLessonMapping,
  UserLessonMappingCreateInput,
  UserLessonMappingDeleteInput,
  UserLessonMappingUpdateInput,
  UserUpdateInput,
  Video,
  VideoCreateInput,
  VideoDeleteInput,
  VideoProgress,
  VideoProgressCreateInput,
  VideoUpdateInput,
} from '@/types/api';
import {
  authApi,
  bucketMasterApi,
  clearSession,
  courseMasterApi,
  coursesApi,
  getStoredUser,
  getToken,
  mappingsApi,
  moduleMasterApi,
  modulesApi,
  lessonMasterApi,
  lessonsApi,
  lessonVideoMappingApi,
  lessonVideoMappingsApi,
  lessonNoteApi,
  lessonNotesApi,
  profileApi,
  sessionMasterApi,
  sessionsApi,
  setSession,
  studentApi,
  userSessionMappingApi,
  userLessonMappingApi,
  userLessonMappingsApi,
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
    get: (explicitUserRefId?: string): Promise<User> => (isDemoMode ? demoApi.profile() : profileApi.get(explicitUserRefId)),
  },

  student: {
    mySessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
      isDemoMode ? demoApi.mySessions(params) : studentApi.mySessions(params),
    session: (id: string): Promise<Session> =>
      isDemoMode ? demoApi.session(id) : studentApi.session(id),
    videoForSession: (sessionId: string): Promise<Video> =>
      isDemoMode ? demoApi.videoForSession(sessionId) : studentApi.videoForSession(sessionId),
  },

  courseMaster: {
    getAllCourses: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
      isDemoMode ? demoApi.courses.list(params) : courseMasterApi.getAllCourses(params),
    getCourse: (courseRefId: string): Promise<Course> =>
      isDemoMode ? demoApi.courses.get(courseRefId) : courseMasterApi.getCourse(courseRefId),
    createCourse: (body: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    updateCourse: (body: CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    deleteCourse: (payload: CourseDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.courses.remove(typeof payload === 'string' ? payload : payload.courseRefId) : courseMasterApi.deleteCourse(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
      isDemoMode ? demoApi.courses.list(params) : courseMasterApi.getAllCourses(params),
    get: (courseRefId: string): Promise<Course> =>
      isDemoMode ? demoApi.courses.get(courseRefId) : courseMasterApi.getCourse(courseRefId),
    create: (body: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    update: (body: CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    remove: (payload: CourseDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.courses.remove(typeof payload === 'string' ? payload : payload.courseRefId) : courseMasterApi.deleteCourse(payload),
  },

  courses: {
    getAllCourses: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
      isDemoMode ? demoApi.courses.list(params) : courseMasterApi.getAllCourses(params),
    getCourse: (courseRefId: string): Promise<Course> =>
      isDemoMode ? demoApi.courses.get(courseRefId) : courseMasterApi.getCourse(courseRefId),
    createCourse: (body: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    updateCourse: (body: CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    deleteCourse: (payload: CourseDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.courses.remove(typeof payload === 'string' ? payload : payload.courseRefId) : courseMasterApi.deleteCourse(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
      isDemoMode ? demoApi.courses.list(params) : courseMasterApi.getAllCourses(params),
    get: (courseRefId: string): Promise<Course> =>
      isDemoMode ? demoApi.courses.get(courseRefId) : courseMasterApi.getCourse(courseRefId),
    create: (body: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    update: (body: CourseUpdateInput): Promise<Course> =>
      isDemoMode ? demoApi.courses.create(body) : courseMasterApi.createCourse(body),
    remove: (payload: CourseDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.courses.remove(typeof payload === 'string' ? payload : payload.courseRefId) : courseMasterApi.deleteCourse(payload),
  },

  moduleMaster: {
    getAllModules: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
      isDemoMode ? demoApi.modules.list(params) : moduleMasterApi.getAllModules(params),
    getModule: (moduleRefId: string): Promise<Module> =>
      isDemoMode ? demoApi.modules.get(moduleRefId) : moduleMasterApi.getModule(moduleRefId),
    createModule: (body: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    updateModule: (body: ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    deleteModule: (payload: ModuleDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.modules.remove(typeof payload === 'string' ? payload : payload.moduleRefId) : moduleMasterApi.deleteModule(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
      isDemoMode ? demoApi.modules.list(params) : moduleMasterApi.getAllModules(params),
    get: (moduleRefId: string): Promise<Module> =>
      isDemoMode ? demoApi.modules.get(moduleRefId) : moduleMasterApi.getModule(moduleRefId),
    create: (body: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    update: (body: ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    remove: (payload: ModuleDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.modules.remove(typeof payload === 'string' ? payload : payload.moduleRefId) : moduleMasterApi.deleteModule(payload),
  },

  modules: {
    getAllModules: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
      isDemoMode ? demoApi.modules.list(params) : moduleMasterApi.getAllModules(params),
    getModule: (moduleRefId: string): Promise<Module> =>
      isDemoMode ? demoApi.modules.get(moduleRefId) : moduleMasterApi.getModule(moduleRefId),
    createModule: (body: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    updateModule: (body: ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    deleteModule: (payload: ModuleDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.modules.remove(typeof payload === 'string' ? payload : payload.moduleRefId) : moduleMasterApi.deleteModule(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
      isDemoMode ? demoApi.modules.list(params) : moduleMasterApi.getAllModules(params),
    get: (id: string): Promise<Module> =>
      isDemoMode ? demoApi.modules.get(id) : moduleMasterApi.getModule(id),
    create: (body: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create(body) : moduleMasterApi.createModule(body),
    update: (id: string, body: ModuleUpdateInput): Promise<Module> =>
      isDemoMode ? demoApi.modules.create({ ...body, moduleRefId: id }) : moduleMasterApi.createModule({ ...body, moduleRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.modules.remove(id) : moduleMasterApi.deleteModule({ moduleRefId: id }),
  },

  lessonMaster: {
    getAllLessons: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
      isDemoMode ? demoApi.lessons.list(params) : lessonMasterApi.getAllLessons(params),
    getLesson: (lessonRefId: string): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.get(lessonRefId) : lessonMasterApi.getLesson(lessonRefId),
    createLesson: (body: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    updateLesson: (body: LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    deleteLesson: (payload: LessonDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.lessons.remove(typeof payload === 'string' ? payload : payload.lessonRefId) : lessonMasterApi.deleteLesson(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
      isDemoMode ? demoApi.lessons.list(params) : lessonMasterApi.getAllLessons(params),
    get: (lessonRefId: string): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.get(lessonRefId) : lessonMasterApi.getLesson(lessonRefId),
    create: (body: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    update: (body: LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    remove: (payload: LessonDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.lessons.remove(typeof payload === 'string' ? payload : payload.lessonRefId) : lessonMasterApi.deleteLesson(payload),
  },

  lessons: {
    getAllLessons: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
      isDemoMode ? demoApi.lessons.list(params) : lessonMasterApi.getAllLessons(params),
    getLesson: (lessonRefId: string): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.get(lessonRefId) : lessonMasterApi.getLesson(lessonRefId),
    createLesson: (body: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    updateLesson: (body: LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    deleteLesson: (payload: LessonDeleteInput | string): Promise<void> =>
      isDemoMode ? demoApi.lessons.remove(typeof payload === 'string' ? payload : payload.lessonRefId) : lessonMasterApi.deleteLesson(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
      isDemoMode ? demoApi.lessons.list(params) : lessonMasterApi.getAllLessons(params),
    get: (id: string): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.get(id) : lessonMasterApi.getLesson(id),
    create: (body: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create(body) : lessonMasterApi.createLesson(body),
    update: (id: string, body: LessonUpdateInput): Promise<Lesson> =>
      isDemoMode ? demoApi.lessons.create({ ...body, lessonRefId: id }) : lessonMasterApi.createLesson({ ...body, lessonRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode ? demoApi.lessons.remove(id) : lessonMasterApi.deleteLesson({ lessonRefId: id }),
  },

  lessonVideoMapping: {
    getAllLessonVideoMappings: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
      isDemoMode ? demoApi.lessonVideoMappings.list(params) : lessonVideoMappingApi.getAllLessonVideoMappings(params),
    getLessonVideoMapping: (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.get(lessonVideoMappingRefId) : lessonVideoMappingApi.getLessonVideoMapping(lessonVideoMappingRefId),
    createLessonVideoMapping: (body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    updateLessonVideoMapping: (body: LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    deleteLessonVideoMapping: (payload: LessonVideoMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonVideoMappings.remove(typeof payload === 'string' ? payload : payload.lessonVideoMappingRefId)
        : lessonVideoMappingApi.deleteLessonVideoMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
      isDemoMode ? demoApi.lessonVideoMappings.list(params) : lessonVideoMappingApi.getAllLessonVideoMappings(params),
    get: (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.get(lessonVideoMappingRefId) : lessonVideoMappingApi.getLessonVideoMapping(lessonVideoMappingRefId),
    create: (body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    update: (body: LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    remove: (payload: LessonVideoMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonVideoMappings.remove(typeof payload === 'string' ? payload : payload.lessonVideoMappingRefId)
        : lessonVideoMappingApi.deleteLessonVideoMapping(payload),
  },

  lessonVideoMappings: {
    getAllLessonVideoMappings: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
      isDemoMode ? demoApi.lessonVideoMappings.list(params) : lessonVideoMappingApi.getAllLessonVideoMappings(params),
    getLessonVideoMapping: (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.get(lessonVideoMappingRefId) : lessonVideoMappingApi.getLessonVideoMapping(lessonVideoMappingRefId),
    createLessonVideoMapping: (body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    updateLessonVideoMapping: (body: LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    deleteLessonVideoMapping: (payload: LessonVideoMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonVideoMappings.remove(typeof payload === 'string' ? payload : payload.lessonVideoMappingRefId)
        : lessonVideoMappingApi.deleteLessonVideoMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
      isDemoMode ? demoApi.lessonVideoMappings.list(params) : lessonVideoMappingApi.getAllLessonVideoMappings(params),
    get: (id: string): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.get(id) : lessonVideoMappingApi.getLessonVideoMapping(id),
    create: (body: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode ? demoApi.lessonVideoMappings.create(body) : lessonVideoMappingApi.createLessonVideoMapping(body),
    update: (id: string, body: LessonVideoMappingUpdateInput): Promise<LessonVideoMapping> =>
      isDemoMode
        ? demoApi.lessonVideoMappings.create({ ...body, lessonVideoMappingRefId: id })
        : lessonVideoMappingApi.createLessonVideoMapping({ ...body, lessonVideoMappingRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonVideoMappings.remove(id)
        : lessonVideoMappingApi.deleteLessonVideoMapping({ lessonVideoMappingRefId: id }),
  },

  lessonNotes: {
    getAllLessonNotes: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
      isDemoMode ? demoApi.lessonNotes.list(params) : lessonNotesApi.getAllLessonNotes(params),
    getLessonNotes: (lessonNotesRefId: string): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.get(lessonNotesRefId) : lessonNotesApi.getLessonNotes(lessonNotesRefId),
    createLessonNotes: (body: LessonNotesCreateInput | LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    updateLessonNotes: (body: LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    deleteLessonNotes: (payload: LessonNotesDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonNotes.remove(typeof payload === 'string' ? payload : payload.lessonNotesRefId)
        : lessonNotesApi.deleteLessonNotes(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
      isDemoMode ? demoApi.lessonNotes.list(params) : lessonNotesApi.getAllLessonNotes(params),
    get: (lessonNotesRefId: string): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.get(lessonNotesRefId) : lessonNotesApi.getLessonNotes(lessonNotesRefId),
    create: (body: LessonNotesCreateInput | LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    update: (body: LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    remove: (payload: LessonNotesDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonNotes.remove(typeof payload === 'string' ? payload : payload.lessonNotesRefId)
        : lessonNotesApi.deleteLessonNotes(payload),
  },

  lessonNote: {
    getAllLessonNotes: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
      isDemoMode ? demoApi.lessonNotes.list(params) : lessonNotesApi.getAllLessonNotes(params),
    getLessonNotes: (lessonNotesRefId: string): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.get(lessonNotesRefId) : lessonNotesApi.getLessonNotes(lessonNotesRefId),
    createLessonNotes: (body: LessonNotesCreateInput | LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    updateLessonNotes: (body: LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    deleteLessonNotes: (payload: LessonNotesDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonNotes.remove(typeof payload === 'string' ? payload : payload.lessonNotesRefId)
        : lessonNotesApi.deleteLessonNotes(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
      isDemoMode ? demoApi.lessonNotes.list(params) : lessonNotesApi.getAllLessonNotes(params),
    get: (id: string): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.get(id) : lessonNotesApi.getLessonNotes(id),
    create: (body: LessonNotesCreateInput | LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode ? demoApi.lessonNotes.create(body) : lessonNotesApi.createLessonNotes(body),
    update: (id: string, body: LessonNotesUpdateInput): Promise<LessonNotes> =>
      isDemoMode
        ? demoApi.lessonNotes.create({ ...body, lessonNotesRefId: id })
        : lessonNotesApi.createLessonNotes({ ...body, lessonNotesRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode
        ? demoApi.lessonNotes.remove(id)
        : lessonNotesApi.deleteLessonNotes({ lessonNotesRefId: id }),
  },

  userLessonMapping: {
    getAllUserLessonMappings: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
      isDemoMode ? demoApi.userLessonMappings.list(params) : userLessonMappingApi.getAllUserLessonMappings(params),
    getUserLessonMapping: (userLessonRefId: string): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.get(userLessonRefId) : userLessonMappingApi.getUserLessonMapping(userLessonRefId),
    createUserLessonMapping: (body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    updateUserLessonMapping: (body: UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    deleteUserLessonMapping: (payload: UserLessonMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.userLessonMappings.remove(typeof payload === 'string' ? payload : payload.userLessonRefId)
        : userLessonMappingApi.deleteUserLessonMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
      isDemoMode ? demoApi.userLessonMappings.list(params) : userLessonMappingApi.getAllUserLessonMappings(params),
    get: (userLessonRefId: string): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.get(userLessonRefId) : userLessonMappingApi.getUserLessonMapping(userLessonRefId),
    create: (body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    update: (body: UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    remove: (payload: UserLessonMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.userLessonMappings.remove(typeof payload === 'string' ? payload : payload.userLessonRefId)
        : userLessonMappingApi.deleteUserLessonMapping(payload),
  },

  userLessonMappings: {
    getAllUserLessonMappings: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
      isDemoMode ? demoApi.userLessonMappings.list(params) : userLessonMappingApi.getAllUserLessonMappings(params),
    getUserLessonMapping: (userLessonRefId: string): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.get(userLessonRefId) : userLessonMappingApi.getUserLessonMapping(userLessonRefId),
    createUserLessonMapping: (body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    updateUserLessonMapping: (body: UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    deleteUserLessonMapping: (payload: UserLessonMappingDeleteInput | string): Promise<void> =>
      isDemoMode
        ? demoApi.userLessonMappings.remove(typeof payload === 'string' ? payload : payload.userLessonRefId)
        : userLessonMappingApi.deleteUserLessonMapping(payload),
    list: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
      isDemoMode ? demoApi.userLessonMappings.list(params) : userLessonMappingApi.getAllUserLessonMappings(params),
    get: (id: string): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.get(id) : userLessonMappingApi.getUserLessonMapping(id),
    create: (body: UserLessonMappingCreateInput | UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode ? demoApi.userLessonMappings.create(body) : userLessonMappingApi.createUserLessonMapping(body),
    update: (id: string, body: UserLessonMappingUpdateInput): Promise<UserLessonMapping> =>
      isDemoMode
        ? demoApi.userLessonMappings.create({ ...body, userLessonRefId: id })
        : userLessonMappingApi.createUserLessonMapping({ ...body, userLessonRefId: id }),
    remove: (id: string): Promise<void> =>
      isDemoMode
        ? demoApi.userLessonMappings.remove(id)
        : userLessonMappingApi.deleteUserLessonMapping({ userLessonRefId: id }),
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
    getVideoProgress: (videoRefId: string): Promise<VideoProgress | null> =>
      isDemoMode ? demoApi.videos.getVideoProgress(videoRefId) : videoMasterApi.getVideoProgress(videoRefId),
    createVideoProgress: (payload: VideoProgressCreateInput): Promise<void> => {
      if (isDemoMode) {
        void demoApi.videos.createVideoProgress(payload);
      }
      return videoMasterApi.createVideoProgress(payload);
    },
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
    getVideoProgress: (videoRefId: string): Promise<VideoProgress | null> =>
      isDemoMode ? demoApi.videos.getVideoProgress(videoRefId) : videoMasterApi.getVideoProgress(videoRefId),
    createVideoProgress: (payload: VideoProgressCreateInput): Promise<void> => {
      if (isDemoMode) {
        void demoApi.videos.createVideoProgress(payload);
      }
      return videoMasterApi.createVideoProgress(payload);
    },
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
export { courseService, courseMasterService } from './courseService';
export { moduleService, moduleMasterService } from './moduleService';
export { lessonService, lessonMasterService } from './lessonService';
export { lessonVideoMappingService, mappingLessonVideoService } from './lessonVideoMappingService';
export { lessonNotesService, lessonNoteService } from './lessonNotesService';
export { userLessonMappingService, userLessonMappingsService } from './userLessonMappingService';








