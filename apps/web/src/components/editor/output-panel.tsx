'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, MemoryStick, Play, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RunResult, SubmissionTestResult } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';

type OutputTab = 'results' | 'custom' | 'output';

interface TestResultItem {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  runtimeMs?: number;
}

interface OutputPanelProps {
  testResults?: TestResultItem[];
  runResult?: RunResult | null;
  verdict?: SubmissionStatus | null;
  isRunning?: boolean;
  onCustomRun?: (input: string) => void;
}

const VERDICT_CONFIG: Record<string, { label: string; className: string }> = {
  [SubmissionStatus.ACCEPTED]: { label: 'Accepted', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  [SubmissionStatus.WRONG_ANSWER]: { label: 'Wrong Answer', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: { label: 'Time Limit Exceeded', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: { label: 'Memory Limit Exceeded', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  [SubmissionStatus.RUNTIME_ERROR]: { label: 'Runtime Error', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  [SubmissionStatus.COMPILATION_ERROR]: { label: 'Compilation Error', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  [SubmissionStatus.PENDING]: { label: 'Pending', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  [SubmissionStatus.RUNNING]: { label: 'Running...', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

function VerdictBadge({ verdict }: { verdict: SubmissionStatus }) {
  const config = VERDICT_CONFIG[verdict] ?? { label: verdict, className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border', config.className)}>
      {verdict === SubmissionStatus.ACCEPTED && <CheckCircle2 size={12} className="mr-1.5" />}
      {(verdict === SubmissionStatus.WRONG_ANSWER || verdict === SubmissionStatus.RUNTIME_ERROR || verdict === SubmissionStatus.COMPILATION_ERROR) && (
        <XCircle size={12} className="mr-1.5" />
      )}
      {(verdict === SubmissionStatus.TIME_LIMIT_EXCEEDED || verdict === SubmissionStatus.MEMORY_LIMIT_EXCEEDED) && (
        <Clock size={12} className="mr-1.5" />
      )}
      {config.label}
    </span>
  );
}

export function OutputPanel({
  testResults = [],
  runResult,
  verdict,
  isRunning = false,
  onCustomRun,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<OutputTab>('results');
  const [customInput, setCustomInput] = useState('');

  const tabs: { id: OutputTab; label: string }[] = [
    { id: 'results', label: 'Test Results' },
    { id: 'custom', label: 'Custom Input' },
    { id: 'output', label: 'Output' },
  ];

  const passedCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-700">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-700 bg-slate-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium transition-colors border-b-2',
              activeTab === tab.id
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800'
            )}
          >
            {tab.label}
            {tab.id === 'results' && testResults.length > 0 && (
              <span
                className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  passedCount === testResults.length
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {passedCount}/{testResults.length}
              </span>
            )}
          </button>
        ))}

        {verdict && (
          <div className="ml-auto px-3 py-1.5">
            <VerdictBadge verdict={verdict} />
          </div>
        )}

        {isRunning && (
          <div className="ml-auto px-3 flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 size={12} className="animate-spin" />
            Running...
          </div>
        )}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Test Results tab */}
        {activeTab === 'results' && (
          <div className="space-y-2">
            {testResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <AlertCircle size={24} className="mb-2" />
                <p className="text-sm">Run your code to see test results</p>
              </div>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.index}
                  className={cn(
                    'rounded-lg border overflow-hidden',
                    result.passed ? 'border-emerald-700/50' : 'border-red-700/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-xs font-medium',
                      result.passed ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>Case {result.index + 1}</span>
                    </div>
                    {result.runtimeMs !== undefined && (
                      <span className="text-slate-400">{result.runtimeMs}ms</span>
                    )}
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Input:</span>
                      <pre className="bg-slate-900 rounded p-2 text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">{result.input}</pre>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Expected:</span>
                      <pre className="bg-slate-900 rounded p-2 text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">{result.expectedOutput}</pre>
                    </div>
                    {!result.passed && result.actualOutput !== null && (
                      <div>
                        <span className="text-slate-500 block mb-1">Your Output:</span>
                        <pre className="bg-slate-900 rounded p-2 text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">{result.actualOutput}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Custom Input tab */}
        {activeTab === 'custom' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Custom Input
              </label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your custom input here..."
                rows={6}
                className={cn(
                  'w-full bg-slate-900 border border-slate-700 rounded-lg p-3',
                  'text-slate-300 text-xs font-mono resize-y',
                  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
                  'placeholder:text-slate-600'
                )}
              />
            </div>
            <button
              onClick={() => onCustomRun?.(customInput)}
              disabled={isRunning || !onCustomRun}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                'bg-emerald-600 hover:bg-emerald-500 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isRunning ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Play size={12} />
              )}
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        )}

        {/* Output tab */}
        {activeTab === 'output' && (
          <div className="space-y-3">
            {!runResult ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <AlertCircle size={24} className="mb-2" />
                <p className="text-sm">No output yet. Run your code first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {runResult.runtimeMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <MemoryStick size={11} />
                    {(runResult.memoryKb / 1024).toFixed(1)}MB
                  </span>
                  {runResult.timedOut && (
                    <span className="text-yellow-400 font-semibold">Time Limit Exceeded</span>
                  )}
                </div>
                {runResult.stdout && (
                  <div>
                    <span className="block text-xs text-slate-400 mb-1 font-medium">stdout</span>
                    <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-700">
                      {runResult.stdout}
                    </pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div>
                    <span className="block text-xs text-slate-400 mb-1 font-medium">stderr</span>
                    <pre className="bg-red-950/30 rounded-lg p-3 text-xs text-red-300 font-mono overflow-x-auto whitespace-pre-wrap border border-red-800/30">
                      {runResult.stderr}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
