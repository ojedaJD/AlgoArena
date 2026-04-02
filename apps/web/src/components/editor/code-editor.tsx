'use client';

import { useRef } from 'react';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SupportedLanguage = 'python' | 'javascript' | 'cpp' | 'java';

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string; monacoId: string }[] = [
  { value: 'python', label: 'Python 3', monacoId: 'python' },
  { value: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { value: 'cpp', label: 'C++17', monacoId: 'cpp' },
  { value: 'java', label: 'Java 21', monacoId: 'java' },
];

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  readOnly = false,
  height = '100%',
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  const handleMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;

    // Define a dark theme matching the app's slate palette
    monaco.editor.defineTheme('dsa-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fb923c' },
        { token: 'type', foreground: 'a78bfa' },
        { token: 'function', foreground: 'facc15' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#1d4ed880',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editor.inactiveSelectionBackground': '#1e3a5f60',
        'scrollbarSlider.background': '#33415580',
        'scrollbarSlider.hoverBackground': '#475569a0',
        'editorCursor.foreground': '#60a5fa',
      },
    });

    monaco.editor.setTheme('dsa-dark');
  };

  const selectedLang = LANGUAGE_OPTIONS.find((l) => l.value === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Language selector bar */}
      {onLanguageChange && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-700">
          <span className="text-xs text-slate-400 font-medium">Language:</span>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className={cn(
                'appearance-none bg-slate-800 text-slate-200 text-xs font-medium',
                'border border-slate-600 rounded px-3 py-1.5 pr-7',
                'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
                'cursor-pointer hover:border-slate-500 transition-colors'
              )}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          {readOnly && (
            <span className="ml-auto text-xs text-slate-500 italic">Read only</span>
          )}
        </div>
      )}

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height={height}
          language={selectedLang.monacoId}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          onMount={handleMount}
          theme="dsa-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 4,
            insertSpaces: true,
            scrollBeyondLastLine: false,
            readOnly,
            wordWrap: 'off',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
            renderWhitespace: 'selection',
            contextmenu: true,
            folding: true,
            automaticLayout: true,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>
    </div>
  );
}
