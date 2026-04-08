'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Code2,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Track {
  id?: string;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  sections?: Section[];
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  items: Item[];
}

interface Item {
  id: string;
  kind: 'LESSON' | 'TOPIC' | 'PROBLEM';
  title: string;
  refId: string;
  orderIndex: number;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

function TrackForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Track;
  onSave: (data: Partial<Track>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ title, slug, description, orderIndex });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-xl border border-slate-800 bg-slate-900/50">
      <h3 className="text-sm font-semibold text-slate-200">
        {initial ? 'Edit Track' : 'New Track'}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="w-32">
        <label className="block text-xs font-medium text-slate-400 mb-1">Order</label>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="primary" size="sm" loading={saving} leftIcon={<Save size={14} />}>
          {initial ? 'Update' : 'Create'} Track
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} leftIcon={<X size={14} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SectionForm({
  trackSlug,
  initial,
  onSave,
  onCancel,
}: {
  trackSlug: string;
  initial?: Section;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [orderIndex, setOrderIndex] = useState(initial?.orderIndex ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        await apiClient.patch(`/v1/curriculum/tracks/${trackSlug}/sections/${initial.id}`, {
          title,
          orderIndex,
        });
      } else {
        await apiClient.post(`/v1/curriculum/tracks/${trackSlug}/sections`, {
          title,
          orderIndex,
        });
      }
      onSave();
    } catch {
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-400 mb-1">Section Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="w-20">
        <label className="block text-xs font-medium text-slate-400 mb-1">Order</label>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" variant="primary" size="sm" loading={saving}>
        {initial ? 'Update' : 'Add'}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function ItemForm({
  trackSlug,
  sectionId,
  onSave,
  onCancel,
}: {
  trackSlug: string;
  sectionId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<'LESSON' | 'TOPIC' | 'PROBLEM'>('LESSON');
  const [title, setTitle] = useState('');
  const [refId, setRefId] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(
        `/v1/curriculum/tracks/${trackSlug}/sections/${sectionId}/items`,
        { kind, title, refId, orderIndex }
      );
      onSave();
    } catch {
      alert('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 ml-6">
      <div className="w-28">
        <label className="block text-xs font-medium text-slate-400 mb-1">Kind</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as 'LESSON' | 'TOPIC' | 'PROBLEM')}
          className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="LESSON">Lesson</option>
          <option value="TOPIC">Topic</option>
          <option value="PROBLEM">Problem</option>
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="w-48">
        <label className="block text-xs font-medium text-slate-400 mb-1">Ref ID (lesson/topic/problem ID)</label>
        <input
          value={refId}
          onChange={(e) => setRefId(e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="w-16">
        <label className="block text-xs font-medium text-slate-400 mb-1">Order</label>
        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" variant="primary" size="sm" loading={saving}>
        Add
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

// ─── Track Row (Expandable) ───────────────────────────────────────────────────

function TrackRow({
  track,
  onRefresh,
  onEdit,
  onDelete,
  deleting,
}: {
  track: Track;
  onRefresh: () => void;
  onEdit: (track: Track) => void;
  onDelete: (slug: string) => void;
  deleting: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<Track | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [addingItemToSection, setAddingItemToSection] = useState<string | null>(null);

  const toggleExpand = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try {
        const data = await apiClient.get<Track>(`/v1/curriculum/tracks/${track.slug}`);
        setDetail(data);
      } catch {
        // ignore
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded(!expanded);
  };

  const refreshDetail = async () => {
    try {
      const data = await apiClient.get<Track>(`/v1/curriculum/tracks/${track.slug}`);
      setDetail(data);
    } catch {
      // ignore
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its items?')) return;
    try {
      await apiClient.delete(`/v1/curriculum/tracks/${track.slug}/sections/${sectionId}`);
      await refreshDetail();
    } catch {
      alert('Failed to delete section');
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await apiClient.delete(
        `/v1/curriculum/tracks/${track.slug}/sections/${sectionId}/items/${itemId}`
      );
      await refreshDetail();
    } catch {
      alert('Failed to delete item');
    }
  };

  const sections = detail?.sections?.sort((a, b) => a.orderIndex - b.orderIndex) ?? [];
  const KIND_ICONS_MAP = { LESSON: BookOpen, TOPIC: GraduationCap, PROBLEM: Code2 };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      {/* Track header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-950 hover:bg-slate-900/60 transition-colors">
        <button onClick={toggleExpand} className="shrink-0">
          {expanded ? (
            <ChevronDown size={14} className="text-slate-500" />
          ) : (
            <ChevronRight size={14} className="text-slate-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-slate-200">{track.title}</span>
          <span className="ml-2 text-xs text-slate-600 font-mono">{track.slug}</span>
        </div>

        <span className="text-xs text-slate-500 tabular-nums">#{track.orderIndex}</span>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={() => onEdit(track)}
            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(track.slug)}
            disabled={deleting === track.slug}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
          >
            {deleting === track.slug ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-800 bg-slate-900/30 px-4 py-3 space-y-3">
          {loadingDetail && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Loading...
            </div>
          )}

          {!loadingDetail && sections.length === 0 && (
            <p className="text-xs text-slate-600">No sections yet.</p>
          )}

          {sections.map((section) => {
            const sortedItems = section.items.sort((a, b) => a.orderIndex - b.orderIndex);
            return (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {section.title}
                    <span className="ml-2 text-slate-600 normal-case font-normal">
                      ({sortedItems.length} items)
                    </span>
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setAddingItemToSection(
                          addingItemToSection === section.id ? null : section.id
                        )
                      }
                      className="p-1 text-slate-600 hover:text-blue-400 rounded transition-colors"
                      title="Add item"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors"
                      title="Delete section"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                {sortedItems.map((item) => {
                  const KindIcon = KIND_ICONS_MAP[item.kind] ?? BookOpen;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 ml-4 py-1 text-xs text-slate-400"
                    >
                      <KindIcon size={12} className="text-slate-600 shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{item.refId}</span>
                      <span className="text-[10px] text-slate-700 uppercase">{item.kind}</span>
                      <button
                        onClick={() => handleDeleteItem(section.id, item.id)}
                        className="p-0.5 text-slate-700 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  );
                })}

                {/* Add item form */}
                {addingItemToSection === section.id && (
                  <ItemForm
                    trackSlug={track.slug}
                    sectionId={section.id}
                    onSave={() => {
                      setAddingItemToSection(null);
                      refreshDetail();
                    }}
                    onCancel={() => setAddingItemToSection(null)}
                  />
                )}
              </div>
            );
          })}

          {/* Add section form */}
          {addingSection ? (
            <SectionForm
              trackSlug={track.slug}
              onSave={() => {
                setAddingSection(false);
                refreshDetail();
              }}
              onCancel={() => setAddingSection(false)}
            />
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors"
            >
              <Plus size={12} />
              Add Section
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCurriculumPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Track[]>('/v1/curriculum/tracks');
      setTracks(data);
    } catch {
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleCreateOrUpdate = async (data: Partial<Track>) => {
    if (editingTrack) {
      await apiClient.patch(`/v1/curriculum/tracks/${editingTrack.slug}`, data);
    } else {
      await apiClient.post('/v1/curriculum/tracks', data);
    }
    setShowForm(false);
    setEditingTrack(null);
    await fetchTracks();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this track and all its sections/items?')) return;
    setDeleting(slug);
    try {
      await apiClient.delete(`/v1/curriculum/tracks/${slug}`);
      await fetchTracks();
    } catch {
      alert('Failed to delete track');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Curriculum Tracks</h1>
          <p className="text-sm text-slate-400 mt-0.5">{tracks.length} tracks</p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={15} />}
          onClick={() => {
            setEditingTrack(null);
            setShowForm(true);
          }}
        >
          New Track
        </Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="mb-6">
          <TrackForm
            initial={editingTrack ?? undefined}
            onSave={handleCreateOrUpdate}
            onCancel={() => {
              setShowForm(false);
              setEditingTrack(null);
            }}
          />
        </div>
      )}

      {/* Track list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800 p-4">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tracks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((track) => (
              <TrackRow
                key={track.slug}
                track={track}
                onRefresh={fetchTracks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
        </div>
      )}
    </div>
  );
}
