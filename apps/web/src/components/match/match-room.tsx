'use client';

import { useState, useCallback } from 'react';
import { CodeEditor, type SupportedLanguage } from '@/components/editor/code-editor';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import { OutputPanel } from '@/components/editor/output-panel';
import { ProblemStatement } from '@/components/problems/problem-statement';
import { MatchTimer } from './match-timer';
import { OpponentStatus } from './opponent-status';
import type { Problem, MatchRoomState, RunResult } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';
import { submissionsApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const MATCH_DURATION_MS = 45 * 60 * 1000; // 45 minutes

const BOILERPLATES: Record<SupportedLanguage, string> = {
  python: `def solution():\n    pass\n`,
  javascript: `// Your solution here\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}\n`,
  java: `import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {}\n}\n`,
};

interface MatchRoomProps {
  matchState: MatchRoomState;
  problem: Problem;
  currentUserId: string;
  onSubmit: (code: string, language: string) => void;
}

export function MatchRoom({ matchState, problem, currentUserId, onSubmit }: MatchRoomProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(BOILERPLATES.python);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [verdict, setVerdict] = useState<SubmissionStatus | null>(null);

  const opponent = matchState.participants.find((p) => p.userId !== currentUserId);

  const handleRun = useCallback(async () => {
    if (!problem) return;
    setIsRunning(true);
    try {
      const result = await submissionsApi.run(problem.slug, { language, code, input: '' }) as RunResult;
      setRunResult(result);
    } catch {
      // ignore
    } finally {
      setIsRunning(false);
    }
  }, [problem, language, code]);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    setVerdict(SubmissionStatus.PENDING);
    onSubmit(code, language);
    // Submission verdict will come via WebSocket
    setTimeout(() => setIsSubmitting(false), 2000);
  }, [code, language, onSubmit]);

  const handleReset = useCallback(() => {
    setCode(BOILERPLATES[language]);
  }, [language]);

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    if (code === BOILERPLATES[language]) setCode(BOILERPLATES[lang]);
    setLanguage(lang);
  }, [code, language]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Top bar with timer */}
      <div className="flex items-center px-4 h-14 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex-1">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Ranked Match</span>
        </div>
        <MatchTimer
          timeRemainingMs={matchState.timeRemainingMs}
          totalMs={MATCH_DURATION_MS}
          className="absolute left-1/2 -translate-x-1/2"
        />
        <div className="flex-1 flex justify-end">
          <span className="text-xs text-slate-500">Match #{matchState.matchId.slice(0, 8)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: problem statement */}
        <div className="w-[40%] flex flex-col min-h-0 border-r border-slate-800">
          <div className="flex-1 overflow-y-auto p-5">
            <ProblemStatement problem={problem} />
          </div>
        </div>

        {/* Right: editor + output */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <EditorToolbar
            language={language}
            onLanguageChange={handleLanguageChange}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />

          {/* Editor */}
          <div className="flex-1 min-h-0" style={{ flex: '1 1 60%' }}>
            <CodeEditor value={code} onChange={setCode} language={language} height="100%" />
          </div>

          {/* Output */}
          <div style={{ flex: '0 0 35%' }} className="flex flex-col overflow-hidden">
            <OutputPanel
              runResult={runResult}
              verdict={verdict ?? undefined}
              isRunning={isRunning || isSubmitting}
            />
          </div>
        </div>

        {/* Opponent sidebar */}
        {opponent && (
          <div className="w-52 shrink-0 p-3 border-l border-slate-800 flex flex-col gap-4">
            <OpponentStatus opponent={opponent} />
          </div>
        )}
      </div>
    </div>
  );
}
