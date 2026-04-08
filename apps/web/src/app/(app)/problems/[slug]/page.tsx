'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { problemsApi, submissionsApi } from '@/lib/api-client';
import { CodeEditor, type SupportedLanguage } from '@/components/editor/code-editor';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import { OutputPanel } from '@/components/editor/output-panel';
import { ProblemStatement } from '@/components/problems/problem-statement';
import { TestCaseViewer } from '@/components/problems/test-case-viewer';
import type { Problem, TestCase, RunResult } from '@dsa/shared';
import { SubmissionStatus } from '@dsa/shared';

const BOILERPLATES: Record<SupportedLanguage, string> = {
  python: `def solution():\n    # Read input\n    n = int(input())\n    \n    # Your solution here\n    pass\n\nsolution()\n`,
  javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on('line', line => lines.push(line));\nrl.on('close', () => {\n    // Your solution here\n    const n = parseInt(lines[0]);\n    console.log(n);\n});\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Your solution here\n    int n;\n    cin >> n;\n    \n    cout << n << endl;\n    return 0;\n}\n`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Your solution here\n        int n = Integer.parseInt(br.readLine().trim());\n        System.out.println(n);\n    }\n}\n`,
};

type PanelTab = 'statement' | 'submissions' | 'discussions';

export default function ProblemPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState<string | null>(null);

  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(BOILERPLATES.python);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [verdict, setVerdict] = useState<SubmissionStatus | null>(null);
  const [testResults, setTestResults] = useState<
    { index: number; input: string; expectedOutput: string; actualOutput: string | null; passed: boolean; runtimeMs?: number }[]
  >([]);

  const [leftTab, setLeftTab] = useState<PanelTab>('statement');
  const [leftPanelWidth, setLeftPanelWidth] = useState(42); // percent

  // Load problem
  useEffect(() => {
    setIsLoadingProblem(true);
    setProblemError(null);
    Promise.all([
      problemsApi.getBySlug(slug) as Promise<Problem>,
    ])
      .then(([p]) => {
        setProblem(p);
        // Public test cases would come with the problem or a separate endpoint
        setTestCases((p as Problem & { testCases?: TestCase[] }).testCases ?? []);
      })
      .catch((err) => setProblemError(err.message ?? 'Failed to load problem'))
      .finally(() => setIsLoadingProblem(false));
  }, [slug]);

  // When language changes, update boilerplate if code is still default
  const handleLanguageChange = useCallback(
    (lang: SupportedLanguage) => {
      const currentBoilerplate = BOILERPLATES[language];
      if (code === currentBoilerplate || code.trim() === '') {
        setCode(BOILERPLATES[lang]);
      }
      setLanguage(lang);
    },
    [code, language]
  );

  const handleReset = useCallback(() => {
    if (confirm('Reset code to boilerplate? Your current code will be lost.')) {
      setCode(BOILERPLATES[language]);
    }
  }, [language]);

  const handleRun = useCallback(async () => {
    if (!problem) return;
    setIsRunning(true);
    setRunResult(null);
    setTestResults([]);
    setVerdict(null);
    try {
      const result = await submissionsApi.run({ language, code, input: '' }) as RunResult & {
        testResults?: typeof testResults;
      };
      setRunResult(result);
      if (result.testResults) {
        setTestResults(result.testResults);
      } else if (testCases.length > 0) {
        // Build test results from public cases
        const publicCases = testCases.filter((tc) => tc.isPublic);
        setTestResults(
          publicCases.map((tc, idx) => ({
            index: idx,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: result.stdout?.trim() ?? null,
            passed: result.stdout?.trim() === tc.expectedOutput.trim(),
          }))
        );
      }
    } catch (err) {
      const error = err as Error;
      setRunResult({
        stdout: '',
        stderr: error.message ?? 'Run failed',
        exitCode: 1,
        runtimeMs: 0,
        memoryKb: 0,
        timedOut: false,
      });
    } finally {
      setIsRunning(false);
    }
  }, [problem, slug, language, code, testCases]);

  const handleSubmit = useCallback(async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setVerdict(SubmissionStatus.PENDING);
    setRunResult(null);
    setTestResults([]);
    try {
      const submission = await submissionsApi.submit({ problemSlug: slug, language, code }) as {
        id: string;
        status: SubmissionStatus;
        passedCases: number;
        totalCases: number;
        runtimeMs?: number;
        memoryKb?: number;
      };
      setVerdict(submission.status);
    } catch (err) {
      const error = err as Error;
      setVerdict(SubmissionStatus.RUNTIME_ERROR);
      setRunResult({
        stdout: '',
        stderr: error.message ?? 'Submission failed',
        exitCode: 1,
        runtimeMs: 0,
        memoryKb: 0,
        timedOut: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [problem, slug, language, code]);

  const handleCustomRun = useCallback(
    async (input: string) => {
      setIsRunning(true);
      setRunResult(null);
      try {
        const result = await submissionsApi.run({ language, code, input }) as RunResult;
        setRunResult(result);
      } catch (err) {
        const error = err as Error;
        setRunResult({
          stdout: '',
          stderr: error.message,
          exitCode: 1,
          runtimeMs: 0,
          memoryKb: 0,
          timedOut: false,
        });
      } finally {
        setIsRunning(false);
      }
    },
    [slug, language, code]
  );

  // Drag-to-resize divider
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    const container = (e.target as HTMLElement).parentElement!;
    const totalWidth = container.getBoundingClientRect().width;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = startWidth + (delta / totalWidth) * 100;
      setLeftPanelWidth(Math.max(25, Math.min(65, newWidth)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [leftPanelWidth]);

  if (problemError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-lg font-medium text-slate-200">Failed to load problem</p>
        <p className="text-sm mt-1">{problemError}</p>
        <Link href="/problems" className="mt-4 text-blue-400 hover:underline text-sm">
          Back to problems
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Top nav bar */}
      <div className="flex items-center gap-3 px-4 h-11 bg-slate-900 border-b border-slate-700 shrink-0 z-10">
        <Link
          href="/problems"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={14} />
          Problems
        </Link>
        <span className="text-slate-700">|</span>
        {problem ? (
          <span className="text-sm font-medium text-slate-200 truncate">{problem.title}</span>
        ) : (
          <div className="h-4 w-40 bg-slate-800 rounded animate-pulse" />
        )}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/problems/${slug}/submissions`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            <Clock size={12} />
            Submissions
          </Link>
          <Link
            href={`/problems/${slug}/discussions`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            <MessageSquare size={12} />
            Discuss
          </Link>
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Left tab bar */}
          <div className="flex bg-slate-900 border-b border-slate-700 shrink-0">
            {([
              { id: 'statement', label: 'Problem' },
              { id: 'submissions', label: 'Submissions' },
              { id: 'discussions', label: 'Discuss' },
            ] as { id: PanelTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  leftTab === tab.id
                    ? 'text-blue-400 border-blue-500'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {isLoadingProblem ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-7 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-px bg-slate-800 my-4" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-3 bg-slate-800 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            ) : leftTab === 'statement' && problem ? (
              <div className="space-y-6">
                <ProblemStatement problem={problem} />
                {testCases.length > 0 && <TestCaseViewer testCases={testCases} />}
              </div>
            ) : leftTab === 'submissions' ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Clock size={28} className="mb-2 opacity-40" />
                <p className="text-sm">
                  <Link href={`/problems/${slug}/submissions`} className="text-blue-400 hover:underline">
                    View all submissions
                  </Link>
                </p>
              </div>
            ) : leftTab === 'discussions' ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <MessageSquare size={28} className="mb-2 opacity-40" />
                <p className="text-sm">
                  <Link href={`/problems/${slug}/discussions`} className="text-blue-400 hover:underline">
                    View discussions
                  </Link>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Drag divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1 bg-slate-800 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0 active:bg-blue-500"
          title="Drag to resize"
        />

        {/* Right panel */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: `${100 - leftPanelWidth - 0.25}%` }}
        >
          {/* Editor toolbar */}
          <EditorToolbar
            language={language}
            onLanguageChange={handleLanguageChange}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />

          {/* Monaco editor takes 60% of right panel height */}
          <div className="flex-1 min-h-0" style={{ flex: '1 1 60%' }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              height="100%"
            />
          </div>

          {/* Output panel takes 40% */}
          <div style={{ flex: '0 0 40%', minHeight: 0 }} className="flex flex-col overflow-hidden">
            <OutputPanel
              testResults={testResults}
              runResult={runResult}
              verdict={verdict ?? undefined}
              isRunning={isRunning || isSubmitting}
              onCustomRun={handleCustomRun}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
