import { api } from './index';
import type {
  ListParams,
  PaginatedResponse,
  Video,
  VideoCreateInput,
  VideoDeleteInput,
  VideoUpdateInput,
} from '@/types/api';

export const videoService = {
  getAllVideos: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
    api.videos.getAllVideos(params),
  getVideos: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
    api.videos.getAllVideos(params),
  getVideo: (videoRefId: string): Promise<Video> =>
    api.videos.getVideo(videoRefId),
  createVideo: (data: VideoCreateInput | VideoUpdateInput): Promise<Video> =>
    api.videos.createVideo(data),
  updateVideo: (data: VideoUpdateInput): Promise<Video> =>
    api.videos.updateVideo(data),
  deleteVideo: (payload: VideoDeleteInput | string): Promise<void> =>
    api.videos.deleteVideo(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Video>> =>
    api.videos.getAllVideos(params),
  get: (videoRefId: string): Promise<Video> =>
    api.videos.getVideo(videoRefId),
  create: (data: VideoCreateInput | VideoUpdateInput): Promise<Video> =>
    api.videos.createVideo(data),
  update: (data: VideoUpdateInput): Promise<Video> =>
    api.videos.updateVideo(data),
  remove: (payload: VideoDeleteInput | string): Promise<void> =>
    api.videos.deleteVideo(payload),
};

export const videoMasterService = videoService;
export default videoService;
