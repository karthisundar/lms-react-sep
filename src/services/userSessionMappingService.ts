import { api } from './index';
import type {
  ListParams,
  PaginatedResponse,
  UserSessionMapping,
  UserSessionMappingCreateInput,
  UserSessionMappingDeleteInput,
  UserSessionMappingInput,
  UserSessionMappingUpdateInput,
} from '@/types/api';

export const userSessionMappingService = {
  getAllUserSessionMappings: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
    api.userSessionMapping.getAllUserSessionMappings(params),
  getUserSessionMapping: (userSessionRefId: string): Promise<UserSessionMapping> =>
    api.userSessionMapping.getUserSessionMapping(userSessionRefId),
  createUserSessionMapping: (
    data: UserSessionMappingCreateInput | UserSessionMappingUpdateInput | UserSessionMappingInput
  ): Promise<UserSessionMapping> =>
    api.userSessionMapping.createUserSessionMapping(data),
  deleteUserSessionMapping: (payload: UserSessionMappingDeleteInput | string): Promise<void> =>
    api.userSessionMapping.deleteUserSessionMapping(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<UserSessionMapping>> =>
    api.userSessionMapping.getAllUserSessionMappings(params),
  get: (userSessionRefId: string): Promise<UserSessionMapping> =>
    api.userSessionMapping.getUserSessionMapping(userSessionRefId),
  create: (data: UserSessionMappingCreateInput | UserSessionMappingInput): Promise<UserSessionMapping> =>
    api.userSessionMapping.createUserSessionMapping(data),
  update: (
    idOrData: string | UserSessionMappingUpdateInput,
    data?: Partial<UserSessionMappingUpdateInput>
  ): Promise<UserSessionMapping> => {
    if (typeof idOrData === 'string') {
      return api.userSessionMapping.createUserSessionMapping({
        ...(data || {}),
        userSessionRefId: idOrData,
      } as UserSessionMappingUpdateInput);
    }
    return api.userSessionMapping.createUserSessionMapping(idOrData);
  },
  remove: (payload: UserSessionMappingDeleteInput | string): Promise<void> =>
    api.userSessionMapping.deleteUserSessionMapping(payload),
};

export const mappingService = userSessionMappingService;
export default userSessionMappingService;
