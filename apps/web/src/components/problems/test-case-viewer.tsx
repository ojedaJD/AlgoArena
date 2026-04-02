'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestCase } from '@dsa/shared';

interface TestCaseViewerProps {
  testCases: TestCase[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

function TestCaseItem({ testCase, index }: { testCase: TestCase; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800/80 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-slate-400 shrink-0" />
        )}
        <span className="text-xs font-semibold text-slate-300">
          Example {index + 1}
        </span>
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-slate-950/50">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Input</span>
              <CopyButton text={testCase.input} />
            </div>
            <pre className={cn(
              'bg-slate-900 border border-slate-800 rounded p-3',
              'text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap',
              'max-h-32'
            )}>
              {testCase.input}
            </pre>
          </div>

          {/* Expected output */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Output</span>
              <CopyButton text={testCase.expectedOutput} />
            </div>
            <pre className={cn(
              'bg-slate-900 border border-slate-800 rounded p-3',
              'text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap',
              'max-h-32'
            )}>
              {testCase.expectedOutput}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function TestCaseViewer({ testCases }: TestCaseViewerProps) {
  const publicCases = testCases.filter((tc) => tc.isPublic);

  if (publicCases.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
        Sample Test Cases
      </h2>
      <div className="space-y-2">
        {publicCases.map((tc, idx) => (
          <TestCaseItem key={tc.id} testCase={tc} index={idx} />
        ))}
      </div>
    </div>
  );
}
