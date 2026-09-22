import { api } from './index';
import type {
  Course,
  CourseCreateInput,
  CourseDeleteInput,
  CourseUpdateInput,
  ListParams,
  PaginatedResponse,
} from '@/types/api';

export const courseService = {
  getAllCourses: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
    api.courseMaster.getAllCourses(params),
  getCourses: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
    api.courseMaster.getAllCourses(params),
  getCourse: (courseRefId: string): Promise<Course> =>
    api.courseMaster.getCourse(courseRefId),
  createCourse: (data: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
    api.courseMaster.createCourse(data),
  updateCourse: (data: CourseUpdateInput): Promise<Course> =>
    api.courseMaster.update(data),
  deleteCourse: (payload: CourseDeleteInput | string): Promise<void> =>
    api.courseMaster.deleteCourse(payload),

  // Aliases conforming to standard CRUD naming in other project modules
  list: (params?: ListParams): Promise<PaginatedResponse<Course>> =>
    api.courseMaster.getAllCourses(params),
  get: (courseRefId: string): Promise<Course> =>
    api.courseMaster.getCourse(courseRefId),
  create: (data: CourseCreateInput | CourseUpdateInput): Promise<Course> =>
    api.courseMaster.createCourse(data),
  update: (data: CourseUpdateInput): Promise<Course> =>
    api.courseMaster.update(data),
  remove: (payload: CourseDeleteInput | string): Promise<void> =>
    api.courseMaster.deleteCourse(payload),
};

export const courseMasterService = courseService;
export default courseService;
