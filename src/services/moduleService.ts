import { api } from './index';
import type {
  ListParams,
  Module,
  ModuleCreateInput,
  ModuleDeleteInput,
  ModuleUpdateInput,
  PaginatedResponse,
} from '@/types/api';

export const moduleService = {
  getAllModules: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
    api.moduleMaster.getAllModules(params),
  getModules: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
    api.moduleMaster.getAllModules(params),
  getModule: (moduleRefId: string): Promise<Module> =>
    api.moduleMaster.getModule(moduleRefId),
  createModule: (data: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
    api.moduleMaster.createModule(data),
  updateModule: (data: ModuleUpdateInput): Promise<Module> =>
    api.moduleMaster.update(data),
  deleteModule: (payload: ModuleDeleteInput | string): Promise<void> =>
    api.moduleMaster.deleteModule(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Module>> =>
    api.moduleMaster.getAllModules(params),
  get: (moduleRefId: string): Promise<Module> =>
    api.moduleMaster.getModule(moduleRefId),
  create: (data: ModuleCreateInput | ModuleUpdateInput): Promise<Module> =>
    api.moduleMaster.createModule(data),
  update: (data: ModuleUpdateInput): Promise<Module> =>
    api.moduleMaster.update(data),
  remove: (payload: ModuleDeleteInput | string): Promise<void> =>
    api.moduleMaster.deleteModule(payload),
};

export const moduleMasterService = moduleService;
export default moduleService;
