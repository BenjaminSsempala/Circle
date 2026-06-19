'use client';

import { useState } from 'react';
import type { CircleEvent } from '@/lib/services/events';
import { EventFormDrawer } from '@/app/[slug]/_components/EventsSection';

function isUpcoming(date: string) {
  return date >= new Date().toISOString().slice(0, 10);
}

function formatDate(date: string, time?: string | null) {
  const d = new Date(date + 'T00:00:00');
  const str = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return time ? `${str} · ${time}` : str;
}

function EventRow({
  event,
  artistSlug,
  onEdit,
  onToggle,
  onDelete,
}: {
  event: CircleEvent;
  artistSlug: string;
  onEdit: (e: CircleEvent) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const upcoming = isUpcoming(event.date);

  return (
    <div className={`bg-surface border rounded-xl p-4 flex gap-4 transition-all ${event.is_active ? 'border-outline-variant/30' : 'border-outline-variant/20 opacity-60'}`}>
      {/* Poster */}
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-on-surface-variant/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-label-mono font-label-mono text-on-surface font-semibold text-sm truncate">{event.title}</p>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${upcoming ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
            {upcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>
        <p className="text-caption font-caption text-primary text-xs">{formatDate(event.date, event.time)}</p>
        {(event.venue || event.city) && (
          <p className="text-caption font-caption text-on-surface-variant text-xs mt-0.5">
            {[event.venue, event.city].filter(Boolean).join(' · ')}
          </p>
        )}
        {event.short_description && (
          <p className="text-caption font-caption text-on-surface-variant text-xs mt-1 line-clamp-1">{event.short_description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onEdit(event)}
          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(event.id)} className="text-xs text-error font-semibold px-2 py-1 rounded hover:bg-error/10">Confirm</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-on-surface-variant px-2 py-1 rounded">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        <button
          onClick={() => onToggle(event.id, !event.is_active)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${event.is_active ? 'bg-primary' : 'bg-outline-variant'}`}
          title={event.is_active ? 'Hide from profile' : 'Show on profile'}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${event.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}

export function DashboardEventsClient({
  initialEvents,
  artistSlug,
}: {
  initialEvents: CircleEvent[];
  artistSlug: string;
}) {
  const [events, setEvents] = useState<CircleEvent[]>(initialEvents);
  const [editing, setEditing] = useState<CircleEvent | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const upcoming = events.filter((e) => isUpcoming(e.date));
  const past = events.filter((e) => !isUpcoming(e.date));

  function handleSaved(event: CircleEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx === -1) return [...prev, event].sort((a, b) => a.date.localeCompare(b.date));
      const next = [...prev];
      next[idx] = event;
      return next;
    });
    setEditing(null);
    setShowAdd(false);
  }

  async function handleToggle(id: string, active: boolean) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, is_active: active } : e));
    await fetch(`/api/artists/${artistSlug}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    });
  }

  async function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/artists/${artistSlug}/events/${id}`, { method: 'DELETE' });
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-12 text-center">
          <p className="text-on-surface-variant text-body-md font-body-md mb-1">No events yet.</p>
          <p className="text-caption font-caption text-on-surface-variant mb-4">Add your first upcoming show or appearance.</p>
          <button onClick={() => setShowAdd(true)} className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
            + Add event
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} artistSlug={artistSlug} onEdit={setEditing} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3">Past</h2>
              <div className="flex flex-col gap-3">
                {[...past].reverse().map((e) => (
                  <EventRow key={e.id} event={e} artistSlug={artistSlug} onEdit={setEditing} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showAdd && (
        <EventFormDrawer
          initial={null}
          artistSlug={artistSlug}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
      {editing && (
        <EventFormDrawer
          initial={editing}
          artistSlug={artistSlug}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
