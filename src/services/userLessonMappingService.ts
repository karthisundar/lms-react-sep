import { api } from './index';
import type {
  ListParams,
  PaginatedResponse,
  UserLessonMapping,
  UserLessonMappingCreateInput,
  UserLessonMappingDeleteInput,
  UserLessonMappingUpdateInput,
} from '@/types/api';

export const userLessonMappingService = {
  getAllUserLessonMappings: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
    api.userLessonMappings.getAllUserLessonMappings(params),
  getUserLessonMappings: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
    api.userLessonMappings.getAllUserLessonMappings(params),
  getUserLessonMapping: (userLessonRefId: string): Promise<UserLessonMapping> =>
    api.userLessonMappings.getUserLessonMapping(userLessonRefId),
  createUserLessonMapping: (
    data: UserLessonMappingCreateInput | UserLessonMappingUpdateInput
  ): Promise<UserLessonMapping> =>
    api.userLessonMappings.createUserLessonMapping(data),
  updateUserLessonMapping: (
    data: UserLessonMappingUpdateInput
  ): Promise<UserLessonMapping> =>
    api.userLessonMappings.createUserLessonMapping(data),
  deleteUserLessonMapping: (
    payload: UserLessonMappingDeleteInput | string
  ): Promise<void> =>
    api.userLessonMappings.deleteUserLessonMapping(payload),

  // Aliases conforming to standard CRUD naming
  list: (params?: ListParams): Promise<PaginatedResponse<UserLessonMapping>> =>
    api.userLessonMappings.getAllUserLessonMappings(params),
  get: (userLessonRefId: string): Promise<UserLessonMapping> =>
    api.userLessonMappings.getUserLessonMapping(userLessonRefId),
  create: (
    data: UserLessonMappingCreateInput | UserLessonMappingUpdateInput
  ): Promise<UserLessonMapping> =>
    api.userLessonMappings.createUserLessonMapping(data),
  update: (
    data: UserLessonMappingUpdateInput
  ): Promise<UserLessonMapping> =>
    api.userLessonMappings.createUserLessonMapping(data),
  remove: (payload: UserLessonMappingDeleteInput | string): Promise<void> =>
    api.userLessonMappings.deleteUserLessonMapping(payload),
};

export const userLessonMappingsService = userLessonMappingService;
export default userLessonMappingService;
