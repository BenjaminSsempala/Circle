'use client';

import { useState } from 'react';

export function EditableBio({ bio: initial, isOwner }: { bio: string | null; isOwner: boolean }) {
  const [bio, setBio] = useState(initial ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/artists/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: draft }),
    });
    setBio(draft);
    setSaving(false);
    setEditing(false);
  };

  if (!bio && !isOwner) return null;

  return (
    <section className="flex flex-col gap-md">
      <div className="flex items-center gap-2 group">
        <h2 className="text-headline-md font-headline-md text-primary">About the Artist</h2>
        {isOwner && !editing && (
          <button
            onClick={() => { setDraft(bio); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary p-1 rounded-md"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="w-full resize-none"
            placeholder="Write your bio here…"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : bio ? (
        <p className="text-body-lg font-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">{bio}</p>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-on-surface-variant border border-dashed border-outline-variant rounded-xl p-4 hover:border-primary hover:text-primary transition-colors text-left"
        >
          + Add a bio to introduce yourself to clients
        </button>
      )}
    </section>
  );
}
