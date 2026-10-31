import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Terminal, Shield, Code2, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PythonEditor from '@/components/PythonEditor';
import QuestionsAnswersPanel from '@/components/QuestionsAnswersPanel';

export default function PythonEditorPage() {
  const { user } = useAuth();
  const [activeCodeToLoad, setActiveCodeToLoad] = useState<string | undefined>(undefined);

  // Strict role check: accessible only to User role
  if (!user || user.role !== 'user') {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/login'} replace />;
  }

  const handleLoadCodeToEditor = (codeSnippet: string) => {
    setActiveCodeToLoad(codeSnippet);
    // Smooth scroll to editor on smaller screens
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Code2 className="h-3.5 w-3.5" />
              Python Workspace
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Shield className="h-3 w-3" />
              User Role Only
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Python Code Editor & Assessments
          </h1>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Write, edit, and validate Python code. Work through interactive questions and test your syntax with instant feedback.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <Terminal className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span className="font-medium">Active Language:</span>
            <span className="font-semibold text-gray-900 dark:text-white">Python 3</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Editor + Questions & Answers) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Python Editor (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col min-h-[580px]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Interactive Python Editor
              </h2>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Syntax Checking Enabled
            </span>
          </div>

          <div className="flex-1 min-h-[520px]">
            <PythonEditor activeQuestionSolution={activeCodeToLoad} />
          </div>
        </div>

        {/* Right Column: Questions & Answers Panel (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col min-h-[580px]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Questions & Answers
              </h2>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Live Database Content
            </span>
          </div>

          <div className="flex-1 min-h-[520px]">
            <QuestionsAnswersPanel onLoadCodeToEditor={handleLoadCodeToEditor} />
          </div>
        </div>
      </div>
    </div>
  );
}
