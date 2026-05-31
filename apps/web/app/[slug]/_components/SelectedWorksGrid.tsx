'use client';

import { useState } from 'react';
import type { Work } from '@/lib/services/artists';
import { AddWorkModal } from './AddWorkModal';
import { MediaPreviewModal } from './MediaPreviewModal';

// ─── Type/provider icons ──────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-0.5" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

function AudioIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
      </svg>
    </div>
  );
}

function DocIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
      </svg>
    </div>
  );
}

function getTypeIcon(work: Work) {
  if (work.type === 'video') return <PlayIcon />;
  if (work.type === 'audio') return <AudioIcon />;
  if (work.type === 'document') return <DocIcon />;
  return null;
}

const PROVIDER_LABEL: Record<Work['provider'], string> = {
  youtube: 'YouTube', tiktok: 'TikTok', spotify: 'Spotify',
  soundcloud: 'SoundCloud', instagram: 'Instagram', cloudinary: 'Upload',
};

// ─── Fallback thumbnail backgrounds ──────────────────────────────────────────

const FALLBACK_BG: Record<Work['type'], string> = {
  video: 'from-gray-900 to-gray-800',
  audio: 'from-[#121212] to-[#1DB95420]',
  image: 'from-primary/30 to-primary/10',
  document: 'from-secondary/30 to-secondary/10',
};

// ─── Single work card ─────────────────────────────────────────────────────────

function WorkCard({
  work,
  featured,
  isOwner,
  onEdit,
  onDelete,
  onClick,
  onMoveUp,
  onMoveDown,
}: {
  work: Work;
  featured: boolean;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`relative group rounded-xl overflow-hidden shadow-sm border border-outline-variant cursor-pointer ${featured ? 'md:col-span-2' : ''}`}
      onClick={onClick}
    >
      {/* Background */}
      {work.thumbnail_url ? (
        <img
          src={work.thumbnail_url}
          alt={work.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_BG[work.type]}`} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Type icon — centred */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        {getTypeIcon(work)}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3">
        <span className="text-label-mono font-label-mono text-tertiary-fixed bg-tertiary-fixed/20 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold">
          {work.category}
        </span>
        {isOwner && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {onMoveUp && (
              <button onClick={onMoveUp} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm" title="Move up">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
            )}
            {onMoveDown && (
              <button onClick={onMoveDown} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm" title="Move down">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            )}
            <button onClick={onEdit} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm" title="Edit">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            {confirmDelete ? (
              <>
                <button onClick={onDelete} className="px-2 py-1 rounded-lg bg-error/80 text-white text-xs font-semibold hover:bg-error backdrop-blur-sm">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-lg bg-black/40 text-white text-xs hover:bg-black/60 backdrop-blur-sm">Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-error/70 transition-colors backdrop-blur-sm" title="Delete">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-md">
        <h3 className={`font-semibold text-white leading-snug ${featured ? 'text-headline-md font-headline-md' : 'text-body-lg font-body-lg'}`}>
          {work.title}
        </h3>
        <p className="text-caption font-caption text-white/70 mt-0.5">
          {PROVIDER_LABEL[work.provider]}{work.metadata?.year ? ` · ${work.metadata.year}` : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Main grid ────────────────────────────────────────────────────────────────

const MAX_WORKS = 6;
const VISIBLE_COUNT = 4;

export function SelectedWorksGrid({
  works: initial,
  isOwner,
}: {
  works: Work[];
  isOwner: boolean;
}) {
  const [works, setWorks] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWork, setEditWork] = useState<Work | undefined>();
  const [previewWork, setPreviewWork] = useState<Work | undefined>();

  const sorted = [...works].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const atLimit = works.length >= MAX_WORKS;
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT);
  const hiddenCount = works.length - VISIBLE_COUNT;

  const handleAdd = (work: Work) => {
    setWorks((prev) => {
      const exists = prev.find((w) => w.id === work.id);
      return exists ? prev.map((w) => (w.id === work.id ? work : w)) : [...prev, work];
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/artists/works/${id}`, { method: 'DELETE' });
    setWorks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const s = [...works].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = s.findIndex((w) => w.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === s.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [s[idx], s[swapIdx]] = [s[swapIdx], s[idx]];
    const reordered = s.map((w, i) => ({ ...w, order: i }));
    setWorks(reordered);
    await fetch('/api/artists/works/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map((w) => w.id) }),
    });
  };

  return (
    <section className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md font-headline-md text-primary">Selected Works</h2>
        {isOwner && (
          <div className="flex items-center gap-3">
            {atLimit && (
              <span className="text-xs text-on-surface-variant">6 / 6 — delete one to add more</span>
            )}
            {!atLimit && (
              <button
                onClick={() => { setEditWork(undefined); setShowAddModal(true); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add work {works.length > 0 && <span className="text-on-surface-variant font-normal">({works.length}/{MAX_WORKS})</span>}
              </button>
            )}
          </div>
        )}
      </div>

      {works.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md auto-rows-[250px]">
            {visible.map((work, i) => {
              const fullIdx = sorted.findIndex((w) => w.id === work.id);
              return (
                <WorkCard
                  key={work.id}
                  work={work}
                  featured={i === 0}
                  isOwner={isOwner}
                  onClick={() => setPreviewWork(work)}
                  onEdit={() => { setEditWork(work); setShowAddModal(true); }}
                  onDelete={() => handleDelete(work.id)}
                  onMoveUp={isOwner && fullIdx > 0 ? () => handleReorder(work.id, 'up') : undefined}
                  onMoveDown={isOwner && fullIdx < sorted.length - 1 ? () => handleReorder(work.id, 'down') : undefined}
                />
              );
            })}
          </div>

          {hiddenCount > 0 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="self-center text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              View {hiddenCount} more work{hiddenCount > 1 ? 's' : ''}
            </button>
          )}
          {expanded && works.length > VISIBLE_COUNT && (
            <button
              onClick={() => setExpanded(false)}
              className="self-center text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
              Show less
            </button>
          )}
        </>
      ) : isOwner ? (
        <button
          onClick={() => { setEditWork(undefined); setShowAddModal(true); }}
          className="rounded-xl border-2 border-dashed border-outline-variant p-xl flex flex-col items-center gap-3 hover:border-primary hover:text-primary text-on-surface-variant transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <div className="text-center">
            <p className="font-semibold text-sm">Showcase your best work</p>
            <p className="text-xs mt-1 opacity-70">Video · Audio · Images · Documents</p>
          </div>
        </button>
      ) : null}

      {showAddModal && (
        <AddWorkModal
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
          editWork={editWork}
        />
      )}

      {previewWork && (
        <MediaPreviewModal work={previewWork} onClose={() => setPreviewWork(undefined)} />
      )}
    </section>
  );
}
