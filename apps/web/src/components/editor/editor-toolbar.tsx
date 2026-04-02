'use client';

import { Play, Send, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportedLanguage } from './code-editor';

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'cpp', label: 'C++17' },
  { value: 'java', label: 'Java 21' },
];

interface EditorToolbarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function EditorToolbar({
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  onReset,
  isRunning = false,
  isSubmitting = false,
  disabled = false,
}: EditorToolbarProps) {
  const isLoading = isRunning || isSubmitting;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
      {/* Language selector */}
      <div className="relative">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
          disabled={isLoading || disabled}
          className={cn(
            'appearance-none bg-slate-800 text-slate-200 text-xs font-medium',
            'border border-slate-600 rounded px-3 py-1.5 pr-6',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer hover:border-slate-500 transition-colors'
          )}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Reset button */}
        <button
          onClick={onReset}
          disabled={isLoading || disabled}
          title="Reset to boilerplate"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isLoading || disabled}
          title="Run against sample input"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            'bg-emerald-600 hover:bg-emerald-500 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isRunning ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
          {isRunning ? 'Running...' : 'Run'}
        </button>

        {/* Submit button */}
        <button
          onClick={onSubmit}
          disabled={isLoading || disabled}
          title="Submit for judging"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            'bg-blue-600 hover:bg-blue-500 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
