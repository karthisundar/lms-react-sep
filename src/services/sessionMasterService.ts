import { api } from './index';
import type {
  ListParams,
  PaginatedResponse,
  Session,
  SessionCreateInput,
  SessionDeleteInput,
  SessionUpdateInput,
} from '@/types/api';

export const sessionMasterService = {
  getAllSessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
    api.sessionMaster.getAllSessions(params),
  getSessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
    api.sessionMaster.getAllSessions(params),
  getSession: (sessionRefId: string): Promise<Session> =>
    api.sessionMaster.getSession(sessionRefId),
  createSession: (data: SessionCreateInput | SessionUpdateInput): Promise<Session> =>
    api.sessionMaster.createSession(data),
  updateSession: (data: SessionUpdateInput): Promise<Session> =>
    api.sessionMaster.updateSession(data),
  deleteSession: (payload: SessionDeleteInput | string): Promise<void> =>
    api.sessionMaster.deleteSession(payload),
  getUserAssignedSessions: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
    api.student.mySessions(params),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Session>> =>
    api.sessionMaster.getAllSessions(params),
  get: (sessionRefId: string): Promise<Session> =>
    api.sessionMaster.getSession(sessionRefId),
  create: (data: SessionCreateInput | SessionUpdateInput): Promise<Session> =>
    api.sessionMaster.createSession(data),
  update: (data: SessionUpdateInput): Promise<Session> =>
    api.sessionMaster.updateSession(data),
  remove: (payload: SessionDeleteInput | string): Promise<void> =>
    api.sessionMaster.deleteSession(payload),
};

export default sessionMasterService;
