import { api } from './index';
import type {
  ListParams,
  PaginatedResponse,
  User,
  UserCreateInput,
  UserDeleteInput,
  UserUpdateInput,
} from '@/types/api';

export const userService = {
  getAllUsers: (params?: ListParams): Promise<PaginatedResponse<User>> => api.users.getAllUsers(params),
  getUsers: (params?: ListParams): Promise<PaginatedResponse<User>> => api.users.getAllUsers(params),
  getUserById: (id: string): Promise<User> => api.users.get(id),
  createUser: (data: UserCreateInput | UserUpdateInput): Promise<User> => api.users.create(data),
  updateUser: (payload: UserUpdateInput | string, data?: UserUpdateInput): Promise<User> =>
    api.users.update(payload, data),
  deleteUser: (payload: UserDeleteInput | string): Promise<void> => api.users.remove(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<User>> => api.users.getAllUsers(params),
  get: (id: string): Promise<User> => api.users.get(id),
  create: (data: UserCreateInput | UserUpdateInput): Promise<User> => api.users.create(data),
  update: (payload: UserUpdateInput | string, data?: UserUpdateInput): Promise<User> =>
    api.users.update(payload, data),
  remove: (payload: UserDeleteInput | string): Promise<void> => api.users.remove(payload),
};

export default userService;
