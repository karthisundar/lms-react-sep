import { useEffect, useState, useCallback } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Code,
  BookOpen,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { questionService } from '@/services';
import type { QuestionItem, QuestionAnswerItem } from '@/types/api';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui';

interface QuestionsAnswersPanelProps {
  onLoadCodeToEditor?: (codeSnippet: string) => void;
}

export default function QuestionsAnswersPanel({
  onLoadCodeToEditor,
}: QuestionsAnswersPanelProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionService.getEditorQuestions({ limit: 50 });
      const rows = res.row || [];
      setQuestions(rows);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to load questions and answers. Please check your network connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSelectAnswer = (questionId: number, answerRefId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerRefId,
    }));
    // Auto-reveal explanation on answering
    setShowExplanations((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const toggleExplanation = (questionId: number) => {
    setShowExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">
            <HelpCircle className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Questions & Answers
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {questions.length > 0
                ? `${questions.length} Python challenge${questions.length === 1 ? '' : 's'} available`
                : 'Interactive Python questions'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchQuestions}
          disabled={loading}
          className="btn-ghost p-1.5 h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          title="Refresh questions from database"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="py-12">
            <Spinner label="Loading questions & answers from database..." />
          </div>
        )}

        {error && !loading && (
          <div className="space-y-3">
            <ErrorBanner message={error} />
            <button
              type="button"
              onClick={fetchQuestions}
              className="btn-secondary w-full text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Loading Questions</span>
            </button>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <EmptyState
            title="No questions found"
            description="There are currently no questions assigned to this module. Check back once course lessons are published."
            icon={<BookOpen className="h-10 w-10 text-gray-400" />}
          />
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selectedAnswerRef = selectedAnswers[q.questionId];
              const isExplanationOpen = showExplanations[q.questionId];
              const answers: QuestionAnswerItem[] = q.answers || [];
              const correctAnswer = answers.find((a) => a.isCorrect);

              return (
                <div
                  key={q.questionRefId || q.questionId}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 transition-all dark:border-gray-800 dark:bg-gray-950/40"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200/40">
                        {q.questionType || 'Coding'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Award className="h-3.5 w-3.5" />
                      <span>{Number(q.marks) || 1} mark{Number(q.marks) === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Answers & Choices */}
                  {answers.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Select Solution / Answer:
                      </p>

                      <div className="space-y-1.5">
                        {answers.map((ans) => {
                          const isSelected = selectedAnswerRef === ans.answerRefId;
                          const showCorrectness = Boolean(selectedAnswerRef);

                          let borderStyle =
                            'border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-gray-900';
                          if (showCorrectness) {
                            if (ans.isCorrect) {
                              borderStyle =
                                'border-emerald-300 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
                            } else if (isSelected && !ans.isCorrect) {
                              borderStyle =
                                'border-red-300 bg-red-50/80 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200';
                            }
                          } else if (isSelected) {
                            borderStyle =
                              'border-brand-500 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-950/30';
                          }

                          return (
                            <div
                              key={ans.answerRefId || ans.answerId}
                              onClick={() => handleSelectAnswer(q.questionId, ans.answerRefId)}
                              className={`group relative flex items-start gap-3 rounded-lg border p-3 text-xs cursor-pointer transition-all ${borderStyle}`}
                            >
                              <div className="mt-0.5">
                                {showCorrectness ? (
                                  ans.isCorrect ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : isSelected ? (
                                    <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  ) : (
                                    <span className="h-3.5 w-3.5 block rounded-full border border-gray-300 dark:border-gray-600" />
                                  )
                                ) : (
                                  <span
                                    className={`h-3.5 w-3.5 block rounded-full border ${
                                      isSelected
                                        ? 'border-brand-600 bg-brand-600'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-400'
                                    }`}
                                  />
                                )}
                              </div>

                              <div className="flex-1 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                {ans.answerText}
                              </div>

                              {/* Load option into editor button */}
                              {onLoadCodeToEditor && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLoadCodeToEditor(ans.answerText);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
                                  title="Load this code into Python editor"
                                >
                                  <Code className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions & Explanation Row */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-850">
                    {q.explanation ? (
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.questionId)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{isExplanationOpen ? 'Hide Explanation' : 'View Explanation'}</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {correctAnswer && onLoadCodeToEditor && (
                      <button
                        type="button"
                        onClick={() => onLoadCodeToEditor(correctAnswer.answerText)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        title="Load official solution into Python editor"
                      >
                        <span>Load Solution to Editor</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Detailed Explanation Panel */}
                  {isExplanationOpen && q.explanation && (
                    <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-xs text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-200">
                      <p className="font-semibold mb-1 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        Explanation & Analysis
                      </p>
                      <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
