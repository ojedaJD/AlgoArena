'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProblemForm, type ProblemFormData } from '@/components/admin/problem-form';

export default function NewProblemPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProblemFormData) => {
    await apiClient.post('/admin/problems', {
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
    router.push('/admin/problems');
  };

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
          <Plus size={18} className="text-blue-400" />
          New Problem
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProblemForm onSubmit={handleSubmit} submitLabel="Create Problem" />
      </div>
    </div>
  );
}
