'use client';

import { useState } from 'react';
import { Bold, Italic, Code, Loader2, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostEditorProps {
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
  titleField?: boolean;
  initialValue?: string;
}

export function PostEditor({
  onSubmit,
  onCancel,
  placeholder = 'Write your post (supports Markdown)...',
  compact = false,
  titleField = false,
  initialValue = '',
}: PostEditorProps) {
  const [body, setBody] = useState(initialValue);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody('');
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    const ta = document.activeElement as HTMLTextAreaElement;
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);
    const newBody =
      body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(newBody);
    setTimeout(() => {
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
      ta.focus();
    }, 0);
  };

  return (
    <div className={cn(
      'border border-slate-700 rounded-xl overflow-hidden bg-slate-900',
      compact && 'rounded-lg'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors',
              tab === 'write' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors',
              tab === 'preview' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Preview
          </button>
        </div>
        {tab === 'write' && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => insertMarkdown('**')}
              title="Bold"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('_')}
              title="Italic"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`')}
              title="Inline code"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Code size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Title field */}
      {titleField && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title..."
          className={cn(
            'w-full bg-transparent border-b border-slate-700 px-4 py-3',
            'text-sm text-slate-200 placeholder:text-slate-600',
            'focus:outline-none focus:border-blue-500'
          )}
        />
      )}

      {/* Editor / Preview area */}
      {tab === 'write' ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 4 : 8}
          className={cn(
            'w-full bg-transparent px-4 py-3 text-sm text-slate-300',
            'placeholder:text-slate-600 resize-y',
            'focus:outline-none font-mono'
          )}
        />
      ) : (
        <div className={cn(
          'px-4 py-3 text-sm text-slate-300 min-h-[100px]',
          compact ? 'min-h-[96px]' : 'min-h-[192px]'
        )}>
          {body.trim() ? (
            <div className="prose-sm text-slate-300 whitespace-pre-wrap">{body}</div>
          ) : (
            <p className="text-slate-600 italic">Nothing to preview</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 bg-slate-900/50">
        <p className="text-[11px] text-slate-600">Supports Markdown</p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              <X size={11} />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!body.trim() || isSubmitting || (titleField && !title.trim())}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              'bg-blue-600 hover:bg-blue-500 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Send size={11} />
            )}
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
