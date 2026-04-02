'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Loader2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestCase } from '@dsa/shared';

interface TestCaseEntry {
  id?: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  orderIndex: number;
}

interface TestCaseFormProps {
  problemId: string;
  existingCases?: TestCase[];
  onSave: (cases: Omit<TestCase, 'id' | 'problemId'>[]) => Promise<void>;
}

const TEXTAREA_CLASS = cn(
  'w-full bg-slate-800 border border-slate-700 rounded-lg p-3',
  'text-xs font-mono text-slate-300 placeholder:text-slate-600 resize-none',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
  'hover:border-slate-600 transition-colors'
);

export function TestCaseForm({ problemId: _problemId, existingCases = [], onSave }: TestCaseFormProps) {
  const [cases, setCases] = useState<TestCaseEntry[]>(
    existingCases.length > 0
      ? existingCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          orderIndex: tc.orderIndex,
        }))
      : [{ input: '', expectedOutput: '', isPublic: true, orderIndex: 0 }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const addCase = () => {
    setCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isPublic: false, orderIndex: prev.length },
    ]);
  };

  const removeCase = (idx: number) => {
    setCases((prev) => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, orderIndex: i })));
  };

  const updateCase = (idx: number, key: keyof TestCaseEntry, value: TestCaseEntry[typeof key]) => {
    setCases((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  };

  const handleSave = async () => {
    const valid = cases.every((c) => c.input.trim() && c.expectedOutput.trim());
    if (!valid) {
      setError('All test cases must have both input and expected output');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave(
        cases.map((c) => ({
          input: c.input,
          expectedOutput: c.expectedOutput,
          isPublic: c.isPublic,
          orderIndex: c.orderIndex,
        }))
      );
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? 'Failed to save test cases');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {cases.map((tc, idx) => (
        <div
          key={idx}
          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900">
            <GripVertical size={14} className="text-slate-600 cursor-move" />
            <span className="text-xs font-semibold text-slate-400">
              Test Case {idx + 1}
            </span>

            {/* Public/Private toggle */}
            <button
              type="button"
              onClick={() => updateCase(idx, 'isPublic', !tc.isPublic)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                tc.isPublic
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              )}
            >
              {tc.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
              {tc.isPublic ? 'Public (shown to users)' : 'Hidden (judge only)'}
            </button>

            <button
              type="button"
              onClick={() => removeCase(idx)}
              disabled={cases.length === 1}
              className="ml-auto p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-2 gap-0 divide-x divide-slate-800">
            <div className="p-4 space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wide">
                Input
              </label>
              <textarea
                value={tc.input}
                onChange={(e) => updateCase(idx, 'input', e.target.value)}
                rows={5}
                placeholder="5&#10;1 2 3 4 5"
                className={TEXTAREA_CLASS}
              />
            </div>
            <div className="p-4 space-y-1.5">
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wide">
                Expected Output
              </label>
              <textarea
                value={tc.expectedOutput}
                onChange={(e) => updateCase(idx, 'expectedOutput', e.target.value)}
                rows={5}
                placeholder="15"
                className={TEXTAREA_CLASS}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addCase}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add Test Case
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">
            {cases.filter((c) => c.isPublic).length} public · {cases.filter((c) => !c.isPublic).length} hidden
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Test Cases'}
          </button>
        </div>
      </div>
    </div>
  );
}
