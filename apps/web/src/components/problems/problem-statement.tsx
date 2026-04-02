'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, Database, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Difficulty, type Problem } from '@dsa/shared';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; className: string }> = {
  [Difficulty.EASY]: { label: 'Easy', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  [Difficulty.MEDIUM]: { label: 'Medium', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  [Difficulty.HARD]: { label: 'Hard', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

interface ProblemStatementProps {
  problem: Problem;
}

export function ProblemStatement({ problem }: ProblemStatementProps) {
  const difficulty = DIFFICULTY_CONFIG[problem.difficulty];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-xl font-bold text-slate-100 flex-1">{problem.title}</h1>
          <span
            className={cn(
              'shrink-0 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              difficulty.className
            )}
          >
            {difficulty.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            Time: <strong className="text-slate-300">{problem.timeLimitMs}ms</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Database size={13} />
            Memory: <strong className="text-slate-300">{problem.memoryLimitMb}MB</strong>
          </span>
        </div>

        {/* Tags */}
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Tag size={12} className="text-slate-500 mt-0.5 shrink-0" />
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-400 border border-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-800" />

      {/* Markdown statement */}
      <div className="prose-dsa">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-slate-100 mt-5 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-slate-200 mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-slate-300 mt-3 mb-1.5">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 mb-3 ml-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1 mb-3 ml-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-sm text-slate-300">{children}</li>
            ),
            code: ({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) =>
              inline ? (
                <code
                  className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono text-blue-300"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <code
                  className="block bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre"
                  {...props}
                >
                  {children}
                </code>
              ),
            pre: ({ children }) => (
              <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 my-3 overflow-x-auto">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-950/20 rounded-r-lg my-3 text-sm text-slate-300 italic">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-3">
                <table className="w-full text-sm border-collapse border border-slate-700">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-800 text-slate-300">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-slate-800">{children}</tbody>
            ),
            tr: ({ children }) => <tr className="hover:bg-slate-800/50">{children}</tr>,
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold text-slate-300 border border-slate-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-slate-400 border border-slate-700">{children}</td>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-200">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-400">{children}</em>
            ),
            hr: () => <hr className="border-slate-700 my-4" />,
          }}
        >
          {problem.statementMd}
        </ReactMarkdown>
      </div>
    </div>
  );
}
