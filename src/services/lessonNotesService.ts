import { api } from './index';
import type {
  LessonNotes,
  LessonNotesCreateInput,
  LessonNotesDeleteInput,
  LessonNotesUpdateInput,
  ListParams,
  PaginatedResponse,
} from '@/types/api';

export const lessonNotesService = {
  getAllLessonNotes: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
    api.lessonNotes.getAllLessonNotes(params),
  getLessonNotesList: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
    api.lessonNotes.getAllLessonNotes(params),
  getLessonNotes: (lessonNotesRefId: string): Promise<LessonNotes> =>
    api.lessonNotes.getLessonNotes(lessonNotesRefId),
  createLessonNotes: (
    data: FormData | LessonNotesCreateInput | LessonNotesUpdateInput
  ): Promise<LessonNotes> =>
    api.lessonNotes.createLessonNotes(data),
  updateLessonNotes: (
    data: FormData | LessonNotesUpdateInput
  ): Promise<LessonNotes> =>
    api.lessonNotes.createLessonNotes(data),
  deleteLessonNotes: (
    payload: LessonNotesDeleteInput | string
  ): Promise<void> =>
    api.lessonNotes.deleteLessonNotes(payload),

  // Aliases conforming to standard CRUD naming
  list: (params?: ListParams): Promise<PaginatedResponse<LessonNotes>> =>
    api.lessonNotes.getAllLessonNotes(params),
  get: (lessonNotesRefId: string): Promise<LessonNotes> =>
    api.lessonNotes.getLessonNotes(lessonNotesRefId),
  create: (
    data: FormData | LessonNotesCreateInput | LessonNotesUpdateInput
  ): Promise<LessonNotes> =>
    api.lessonNotes.createLessonNotes(data),
  update: (
    data: FormData | LessonNotesUpdateInput
  ): Promise<LessonNotes> =>
    api.lessonNotes.createLessonNotes(data),
  remove: (payload: LessonNotesDeleteInput | string): Promise<void> =>
    api.lessonNotes.deleteLessonNotes(payload),

};

export const lessonNoteService = lessonNotesService;
export default lessonNotesService;
