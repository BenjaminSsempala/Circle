'use client';

import { useState, useRef } from 'react';
import type { CircleEvent, EventContact, EventInput } from '@/lib/services/events';
import { uploadToCloudinary } from '@/lib/upload';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(date: string, time?: string | null) {
  const d = new Date(date + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return time ? `${dateStr} · ${time}` : dateStr;
}

function isUpcoming(date: string) {
  return date >= new Date().toISOString().slice(0, 10);
}

const EMPTY_CONTACT: EventContact = { name: '', phone: '', whatsapp: '', email: '' };

const EMPTY_FORM: Partial<EventInput> = {
  title: '', date: '', time: '', venue: '', city: '',
  ticket_url: '', poster_url: '', short_description: '',
  full_info: '', contacts: [{ ...EMPTY_CONTACT }], is_active: true,
};

// ─── Event detail drawer ──────────────────────────────────────────────────────

function EventDrawer({ event, onClose }: { event: CircleEvent; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Poster */}
        <div className="relative shrink-0">
          {event.poster_url ? (
            <img src={event.poster_url} alt={event.title} className="w-full aspect-[4/3] object-cover" />
          ) : (
            <div className="w-full aspect-[4/3] bg-primary/10 flex items-center justify-center">
              <svg className="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Title + date */}
          <div>
            <h2 className="text-headline-md font-headline-md text-on-surface leading-tight">{event.title}</h2>
            <p className="text-label-mono font-label-mono text-primary text-sm mt-1">
              {formatEventDate(event.date, event.time)}
            </p>
          </div>

          {/* Venue */}
          {(event.venue || event.city) && (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{[event.venue, event.city].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          {/* Full info */}
          {event.full_info && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider mb-2">About this event</p>
              <p className="text-body-md font-body-md text-on-surface leading-relaxed whitespace-pre-line">{event.full_info}</p>
            </div>
          )}

          {/* Contacts */}
          {event.contacts?.length > 0 && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider mb-3">Contacts</p>
              <div className="flex flex-col gap-3">
                {event.contacts.map((c, i) => (
                  <div key={i} className="bg-surface-container rounded-xl p-3">
                    <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold mb-2">{c.name}</p>
                    <div className="flex flex-col gap-1.5">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {c.phone}
                        </a>
                      )}
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-[#25D366] transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ticket CTA */}
        {event.ticket_url && (
          <div className="p-5 border-t border-outline-variant/20 shrink-0">
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Get tickets
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Add / Edit form drawer ───────────────────────────────────────────────────

export function EventFormDrawer({
  initial,
  artistSlug,
  onClose,
  onSaved,
}: {
  initial: CircleEvent | null;
  artistSlug: string;
  onClose: () => void;
  onSaved: (event: CircleEvent) => void;
}) {
  const [form, setForm] = useState<Partial<EventInput>>(
    initial
      ? {
          title: initial.title,
          date: initial.date,
          time: initial.time ?? '',
          venue: initial.venue ?? '',
          city: initial.city ?? '',
          ticket_url: initial.ticket_url ?? '',
          poster_url: initial.poster_url ?? '',
          short_description: initial.short_description ?? '',
          full_info: initial.full_info ?? '',
          contacts: initial.contacts?.length ? initial.contacts : [{ ...EMPTY_CONTACT }],
          is_active: initial.is_active,
        }
      : { ...EMPTY_FORM, contacts: [{ ...EMPTY_CONTACT }] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setContact(idx: number, key: keyof EventContact, value: string) {
    const next = [...(form.contacts ?? [])];
    next[idx] = { ...next[idx], [key]: value };
    setField('contacts', next);
  }

  function addContact() {
    setField('contacts', [...(form.contacts ?? []), { ...EMPTY_CONTACT }]);
  }

  function removeContact(idx: number) {
    const next = (form.contacts ?? []).filter((_, i) => i !== idx);
    setField('contacts', next.length ? next : [{ ...EMPTY_CONTACT }]);
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'circle/events');
      if (url) setField('poster_url', url);
      else setError('Image upload failed: check Cloudinary env vars or paste a URL instead.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title?.trim()) { setError('Title is required'); return; }
    if (!form.date) { setError('Date is required'); return; }
    const contacts = form.contacts?.filter((c) => c.name.trim()) ?? [];
    if (contacts.length === 0) { setError('At least one contact with a name is required'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, contacts };
      const url = initial
        ? `/api/artists/${artistSlug}/events/${initial.id}`
        : `/api/artists/${artistSlug}/events`;
      const res = await fetch(url, {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Save failed');
        return;
      }
      const d = await res.json();
      onSaved(d.event);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary text-sm';
  const labelClass = 'block text-label-mono font-label-mono text-on-surface text-xs mb-1';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/20 shrink-0">
          <h2 className="text-headline-md font-headline-md text-on-surface">
            {initial ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Poster */}
          <div>
            <label className={labelClass}>Event Poster</label>
            {form.poster_url && (
              <img src={form.poster_url} alt="Poster" className="w-full aspect-[4/3] object-cover rounded-lg mb-2" />
            )}
            <div className="flex gap-2">
              <input
                value={form.poster_url ?? ''}
                onChange={(e) => setField('poster_url', e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Paste image URL…"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="shrink-0 border border-outline-variant/40 text-on-surface-variant text-xs px-3 py-2.5 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                {uploading ? '…' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title <span className="text-error">*</span></label>
            <input value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} className={inputClass} placeholder="e.g. Evening Poetry Slam" />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date <span className="text-error">*</span></label>
              <input type="date" value={form.date ?? ''} onChange={(e) => setField('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="time" value={form.time ?? ''} onChange={(e) => setField('time', e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Venue + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Venue</label>
              <input value={form.venue ?? ''} onChange={(e) => setField('venue', e.target.value)} className={inputClass} placeholder="Blankets & Wine" />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input value={form.city ?? ''} onChange={(e) => setField('city', e.target.value)} className={inputClass} placeholder="Kampala" />
            </div>
          </div>

          {/* Short description */}
          <div>
            <label className={labelClass}>Short description <span className="text-on-surface-variant/60">(shown on card)</span></label>
            <textarea
              value={form.short_description ?? ''}
              onChange={(e) => setField('short_description', e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="1–2 lines about the event…"
            />
          </div>

          {/* Full info */}
          <div>
            <label className={labelClass}>Full details <span className="text-on-surface-variant/60">(shown when clicked)</span></label>
            <textarea
              value={form.full_info ?? ''}
              onChange={(e) => setField('full_info', e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Full event description, lineup, dress code, etc."
            />
          </div>

          {/* Ticket URL */}
          <div>
            <label className={labelClass}>Ticket / RSVP link</label>
            <input value={form.ticket_url ?? ''} onChange={(e) => setField('ticket_url', e.target.value)} className={inputClass} placeholder="https://…" />
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Contacts <span className="text-error">*</span></label>
              <button
                type="button"
                onClick={addContact}
                className="text-primary text-xs font-semibold hover:underline"
              >
                + Add contact
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {(form.contacts ?? []).map((c, i) => (
                <div key={i} className="border border-outline-variant/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-caption text-on-surface-variant text-xs">Contact {i + 1}</span>
                    {(form.contacts ?? []).length > 1 && (
                      <button type="button" onClick={() => removeContact(i)} className="text-error text-xs hover:underline">Remove</button>
                    )}
                  </div>
                  <input
                    value={c.name}
                    onChange={(e) => setContact(i, 'name', e.target.value)}
                    className={inputClass}
                    placeholder="Name (e.g. Booking Manager)"
                  />
                  <input
                    value={c.phone ?? ''}
                    onChange={(e) => setContact(i, 'phone', e.target.value)}
                    className={inputClass}
                    placeholder="Phone (+256 7xx xxx xxx)"
                  />
                  <input
                    value={c.whatsapp ?? ''}
                    onChange={(e) => setContact(i, 'whatsapp', e.target.value)}
                    className={inputClass}
                    placeholder="WhatsApp (+256 7xx xxx xxx)"
                  />
                  <input
                    value={c.email ?? ''}
                    onChange={(e) => setContact(i, 'email', e.target.value)}
                    className={inputClass}
                    placeholder="Email"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        <div className="p-5 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Add event'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Public-facing events section ────────────────────────────────────────────

function EventCard({ event, onClick }: { event: CircleEvent; onClick: () => void }) {
  const d = new Date(event.date + 'T00:00:00');

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group"
    >
      {/* Poster thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
        {event.poster_url ? (
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-on-surface-variant/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Date chip */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
          {event.time && (
            <span className="text-on-surface-variant text-[10px]">{event.time}</span>
          )}
        </div>
        <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {event.title}
        </p>
        {(event.venue || event.city) && (
          <p className="text-caption font-caption text-on-surface-variant text-xs truncate">
            {[event.venue, event.city].filter(Boolean).join(' · ')}
          </p>
        )}
        {event.short_description && (
          <p className="text-caption font-caption text-on-surface-variant text-xs mt-0.5 line-clamp-1">
            {event.short_description}
          </p>
        )}
      </div>

      <svg className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary/60 shrink-0 self-center transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function EventsSection({
  initialEvents,
  isOwner,
  artistSlug,
}: {
  initialEvents: CircleEvent[];
  isOwner: boolean;
  artistSlug: string;
}) {
  const [events, setEvents] = useState<CircleEvent[]>(initialEvents);
  const [selected, setSelected] = useState<CircleEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const upcoming = events.filter((e) => isUpcoming(e.date));
  const past = events.filter((e) => !isUpcoming(e.date)).slice(-3).reverse();

  function handleSaved(event: CircleEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx === -1) return [...prev, event].sort((a, b) => a.date.localeCompare(b.date));
      const next = [...prev];
      next[idx] = event;
      return next;
    });
    setShowForm(false);
  }

  if (!isOwner && upcoming.length === 0 && past.length === 0) return null;

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">
          Upcoming Events
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-primary text-xs font-semibold hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add event
          </button>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length === 0 ? (
        <div className="px-4 pb-4 pt-2">
          <p className="text-caption font-caption text-on-surface-variant text-xs text-center py-4">
            {isOwner ? 'No upcoming events: add one above.' : 'No upcoming events.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col px-1 pb-2">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} onClick={() => setSelected(e)} />
          ))}
        </div>
      )}

      {/* Past events toggle */}
      {past.length > 0 && (
        <div className="border-t border-outline-variant/20">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="font-semibold">Past events ({past.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${showPast ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPast && (
            <div className="flex flex-col px-1 pb-2">
              {past.map((e) => (
                <EventCard key={e.id} event={e} onClick={() => setSelected(e)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail drawer */}
      {selected && <EventDrawer event={selected} onClose={() => setSelected(null)} />}

      {/* Add/edit form drawer */}
      {showForm && (
        <EventFormDrawer
          initial={null}
          artistSlug={artistSlug}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
