'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { apiClient, topicsApi } from '@/lib/api-client';
import { TopicForm, type TopicFormData } from '@/components/admin/topic-form';
import type { Topic } from '@dsa/shared';

export default function NewTopicPage() {
  const router = useRouter();
  const [parentTopics, setParentTopics] = useState<Topic[]>([]);

  useEffect(() => {
    topicsApi
      .list()
      .then((data) => setParentTopics(data as Topic[]))
      .catch(() => {});
  }, []);

  const handleSubmit = async (data: TopicFormData) => {
    await apiClient.post('/admin/topics', {
      title: data.title,
      slug: data.slug,
      parentTopicId: data.parentTopicId || null,
      orderIndex: data.orderIndex,
    });
    router.push('/admin/topics');
  };

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/topics"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Topics
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Plus size={18} className="text-blue-400" />
          New Topic
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <TopicForm
          parentTopics={parentTopics}
          onSubmit={handleSubmit}
          submitLabel="Create Topic"
        />
      </div>
    </div>
  );
}
