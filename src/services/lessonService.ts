import { api } from './index';
import type {
  Lesson,
  LessonCreateInput,
  LessonDeleteInput,
  LessonUpdateInput,
  ListParams,
  PaginatedResponse,
} from '@/types/api';

export const lessonService = {
  getAllLessons: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
    api.lessonMaster.getAllLessons(params),
  getLessons: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
    api.lessonMaster.getAllLessons(params),
  getLesson: (lessonRefId: string): Promise<Lesson> =>
    api.lessonMaster.getLesson(lessonRefId),
  createLesson: (data: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
    api.lessonMaster.createLesson(data),
  updateLesson: (data: LessonUpdateInput): Promise<Lesson> =>
    api.lessonMaster.update(data),
  deleteLesson: (payload: LessonDeleteInput | string): Promise<void> =>
    api.lessonMaster.deleteLesson(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Lesson>> =>
    api.lessonMaster.getAllLessons(params),
  get: (lessonRefId: string): Promise<Lesson> =>
    api.lessonMaster.getLesson(lessonRefId),
  create: (data: LessonCreateInput | LessonUpdateInput): Promise<Lesson> =>
    api.lessonMaster.createLesson(data),
  update: (data: LessonUpdateInput): Promise<Lesson> =>
    api.lessonMaster.update(data),
  remove: (payload: LessonDeleteInput | string): Promise<void> =>
    api.lessonMaster.deleteLesson(payload),
};

export const lessonMasterService = lessonService;
export default lessonService;
