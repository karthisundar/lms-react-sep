import { api } from './index';
import type {
  LessonVideoMapping,
  LessonVideoMappingCreateInput,
  LessonVideoMappingDeleteInput,
  LessonVideoMappingUpdateInput,
  ListParams,
  PaginatedResponse,
} from '@/types/api';

export const lessonVideoMappingService = {
  getAllLessonVideoMappings: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
    api.lessonVideoMappings.getAllLessonVideoMappings(params),
  getLessonVideoMappings: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
    api.lessonVideoMappings.getAllLessonVideoMappings(params),
  getLessonVideoMapping: (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.getLessonVideoMapping(lessonVideoMappingRefId),
  createLessonVideoMapping: (
    data: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput
  ): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.createLessonVideoMapping(data),
  updateLessonVideoMapping: (
    data: LessonVideoMappingUpdateInput
  ): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.createLessonVideoMapping(data),
  deleteLessonVideoMapping: (
    payload: LessonVideoMappingDeleteInput | string
  ): Promise<void> =>
    api.lessonVideoMappings.deleteLessonVideoMapping(payload),

  // Aliases conforming to standard CRUD naming
  list: (params?: ListParams): Promise<PaginatedResponse<LessonVideoMapping>> =>
    api.lessonVideoMappings.getAllLessonVideoMappings(params),
  get: (lessonVideoMappingRefId: string): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.getLessonVideoMapping(lessonVideoMappingRefId),
  create: (
    data: LessonVideoMappingCreateInput | LessonVideoMappingUpdateInput
  ): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.createLessonVideoMapping(data),
  update: (
    data: LessonVideoMappingUpdateInput
  ): Promise<LessonVideoMapping> =>
    api.lessonVideoMappings.createLessonVideoMapping(data),
  remove: (payload: LessonVideoMappingDeleteInput | string): Promise<void> =>
    api.lessonVideoMappings.deleteLessonVideoMapping(payload),
};

export const mappingLessonVideoService = lessonVideoMappingService;
export default lessonVideoMappingService;
