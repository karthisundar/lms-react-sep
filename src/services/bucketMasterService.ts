import { api } from './index';
import type {
  Bucket,
  BucketCreateInput,
  BucketDeleteInput,
  BucketUpdateInput,
  ListParams,
  PaginatedResponse,
} from '@/types/api';

export const bucketMasterService = {
  getAllBuckets: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
    api.bucketMaster.getAllBuckets(params),
  getBuckets: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
    api.bucketMaster.getAllBuckets(params),
  getBucket: (bucketRefId: string): Promise<Bucket> =>
    api.bucketMaster.getBucket(bucketRefId),
  createBucket: (data: BucketCreateInput | BucketUpdateInput): Promise<Bucket> =>
    api.bucketMaster.createBucket(data),
  updateBucket: (data: BucketUpdateInput): Promise<Bucket> =>
    api.bucketMaster.update(data),
  deleteBucket: (payload: BucketDeleteInput | string): Promise<void> =>
    api.bucketMaster.deleteBucket(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Bucket>> =>
    api.bucketMaster.getAllBuckets(params),
  get: (bucketRefId: string): Promise<Bucket> =>
    api.bucketMaster.getBucket(bucketRefId),
  create: (data: BucketCreateInput | BucketUpdateInput): Promise<Bucket> =>
    api.bucketMaster.createBucket(data),
  update: (data: BucketUpdateInput): Promise<Bucket> =>
    api.bucketMaster.update(data),
  remove: (payload: BucketDeleteInput | string): Promise<void> =>
    api.bucketMaster.deleteBucket(payload),
};

export default bucketMasterService;
