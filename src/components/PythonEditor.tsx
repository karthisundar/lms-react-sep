import { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Trash2,
  Code2,
} from 'lucide-react';
import { questionService } from '@/services';
import type { PythonSyntaxCheckResult } from '@/types/api';

const DEFAULT_PYTHON_TEMPLATE = `# Python Code Editor
# Write, edit, and validate your Python code below.

def solve_problem():
    greeting = "Hello from Python LMS!"
    print(greeting)
    return greeting

if __name__ == "__main__":
    solve_problem()
`;

interface PythonEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  activeQuestionSolution?: string;
}

export default function PythonEditor({
  initialCode,
  onCodeChange,
  activeQuestionSolution,
}: PythonEditorProps) {
  const [code, setCode] = useState<string>(initialCode || DEFAULT_PYTHON_TEMPLATE);
  const [checking, setChecking] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<PythonSyntaxCheckResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  // If a question solution is loaded from Q&A panel, update editor code
  useEffect(() => {
    if (activeQuestionSolution) {
      setCode(activeQuestionSolution);
      setValidationResult(null);
      if (onCodeChange) onCodeChange(activeQuestionSolution);
    }
  }, [activeQuestionSolution, onCodeChange]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    if (validationResult) {
      // Clear previous validation status on edit
      setValidationResult(null);
    }
    if (onCodeChange) {
      onCodeChange(val);
    }
  };

  // Synchronize line numbers scroll with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key (4 spaces) and Ctrl+Enter to check syntax
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCheckSyntax();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const spaces = '    '; // 4 spaces for Python
      const updatedCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(updatedCode);
      if (onCodeChange) onCodeChange(updatedCode);

      // Restore cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const handleCheckSyntax = useCallback(async () => {
    if (!code || !code.trim()) {
      setValidationResult({
        valid: false,
        message: 'Code is empty. Please enter Python code to check syntax.',
      });
      return;
    }

    setChecking(true);
    setValidationResult(null);

    try {
      const res = await questionService.checkSyntax(code);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: err?.message || 'Failed to communicate with syntax check service.',
      });
    } finally {
      setChecking(false);
    }
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(DEFAULT_PYTHON_TEMPLATE);
    setValidationResult(null);
    if (onCodeChange) onCodeChange(DEFAULT_PYTHON_TEMPLATE);
  };

  const handleClear = () => {
    setCode('');
    setValidationResult(null);
    if (onCodeChange) onCodeChange('');
  };

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-950/60">
        {/* Language & Environment Indicator */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <Terminal className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                Python Editor
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                <Code2 className="h-3 w-3" /> Python 3
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only Python code execution & validation is supported
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="Reset to default template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary py-1.5 px-3 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
            title="Clear editor code"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={handleCheckSyntax}
            disabled={checking}
            className="btn-primary py-1.5 px-4 text-xs font-semibold shadow-sm shadow-brand-500/20"
            title="Validate Python syntax (Ctrl+Enter)"
          >
            {checking ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Check Syntax</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Syntax Feedback Banner */}
      {validationResult && (
        <div
          className={`px-4 py-3 border-b text-sm transition-all duration-200 ${
            validationResult.valid
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : !code.trim()
                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {validationResult.valid ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : !code.trim() ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {validationResult.valid
                    ? 'Syntax Validation Passed'
                    : !code.trim()
                      ? 'Empty Code Warning'
                      : 'Syntax Error Detected'}
                </span>

                {validationResult.line !== undefined && (
                  <span className="inline-flex items-center rounded bg-red-200/80 px-2 py-0.5 font-mono text-xs font-bold text-red-900 dark:bg-red-900/60 dark:text-red-200">
                    Line {validationResult.line}
                    {validationResult.column !== undefined ? `:${validationResult.column}` : ''}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs sm:text-sm leading-relaxed">
                {validationResult.message}
              </p>

              {validationResult.text && (
                <div className="mt-2 rounded bg-black/5 dark:bg-white/5 p-2 font-mono text-xs overflow-x-auto border border-black/10 dark:border-white/10">
                  <span className="text-gray-500 mr-2">Line {validationResult.line}:</span>
                  <span className="font-bold">{validationResult.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div className="relative flex flex-1 min-h-[380px] font-mono text-sm bg-gray-900 text-gray-100">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="select-none py-4 px-3 w-12 shrink-0 text-right font-mono text-xs text-gray-500 bg-gray-950/80 border-r border-gray-800 overflow-hidden leading-6"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isErrorLine = validationResult?.line === lineNum;
            return (
              <div
                key={lineNum}
                className={`transition-colors ${
                  isErrorLine
                    ? 'text-red-400 font-bold bg-red-950/60 -mx-3 px-3 rounded-sm'
                    : 'text-gray-500'
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Code Textarea Area */}
        <div className="relative flex-1">
          <label htmlFor={textareaId} className="sr-only">
            Python Code Editor Input
          </label>
          <textarea
            id={textareaId}
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder="# Write your Python code here..."
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-gray-100 placeholder-gray-600 outline-none focus:ring-0 selection:bg-brand-600/40 tab-size-4"
            style={{
              tabSize: 4,
              whiteSpace: 'pre',
            }}
          />
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/60 px-4 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span>•</span>
          <span>{code.length} characters</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span>Tip: Press</span>
          <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Enter
          </kbd>
          <span>to check syntax</span>
        </div>
      </div>
    </div>
  );
}
