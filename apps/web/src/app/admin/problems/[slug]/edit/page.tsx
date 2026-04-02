'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProblemForm, type ProblemFormData } from '@/components/admin/problem-form';
import { TestCaseForm } from '@/components/admin/test-case-form';
import type { Problem, TestCase } from '@dsa/shared';

type Tab = 'details' | 'testcases';

export default function EditProblemPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get<Problem>(`/admin/problems/${slug}`),
      apiClient.get<TestCase[]>(`/admin/problems/${slug}/test-cases`),
    ])
      .then(([p, tcs]) => {
        setProblem(p);
        setTestCases(tcs);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleSaveProblem = async (data: ProblemFormData) => {
    await apiClient.patch(`/admin/problems/${slug}`, {
      title: data.title,
      slug: data.slug,
      difficulty: data.difficulty,
      statementMd: data.statementMd,
      timeLimitMs: data.timeLimitMs,
      memoryLimitMb: data.memoryLimitMb,
      isPublished: data.isPublished,
      tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
      topicIds: data.topicIds.split(',').map((t) => t.trim()).filter(Boolean),
    });
    if (data.slug !== slug) {
      router.push(`/admin/problems/${data.slug}/edit`);
    }
  };

  const handleSaveTestCases = async (cases: Omit<TestCase, 'id' | 'problemId'>[]) => {
    await apiClient.put(`/admin/problems/${slug}/test-cases`, { testCases: cases });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin" />
        Loading problem...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-400">
        <AlertTriangle size={18} className="text-red-400" />
        Problem not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/problems"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Problems
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Pencil size={16} className="text-blue-400" />
          Edit: {problem.title}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {([
          { id: 'details' as Tab, label: 'Problem Details' },
          { id: 'testcases' as Tab, label: `Test Cases (${testCases.length})` },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        {activeTab === 'details' ? (
          <ProblemForm
            initialData={problem}
            onSubmit={handleSaveProblem}
            submitLabel="Save Changes"
          />
        ) : (
          <TestCaseForm
            problemId={problem.id}
            existingCases={testCases}
            onSave={handleSaveTestCases}
          />
        )}
      </div>
    </div>
  );
}
