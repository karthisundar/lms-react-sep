import { questionApi } from './api';
import type { QuestionItem, PythonSyntaxCheckResult } from '@/types/api';

export const questionService = {
  getAllQuestions: (params?: { page?: number; limit?: number; lessonRefId?: string; status?: string }) =>
    questionApi.getAllQuestions(params),

  getEditorQuestions: (params?: { page?: number; limit?: number; lessonRefId?: string }) =>
    questionApi.getEditorQuestions(params),

  getQuestionByRefId: (questionRefId: string): Promise<QuestionItem> =>
    questionApi.getQuestionByRefId(questionRefId),

  checkSyntax: (code: string): Promise<PythonSyntaxCheckResult> =>
    questionApi.checkSyntax(code),

  // Aliases for standard CRUD compatibility
  list: (params?: { page?: number; limit?: number; lessonRefId?: string }) =>
    questionApi.getEditorQuestions(params),
  get: (questionRefId: string) => questionApi.getQuestionByRefId(questionRefId),
};

export default questionService;
