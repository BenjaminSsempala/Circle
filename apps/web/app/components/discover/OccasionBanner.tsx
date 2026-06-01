'use client';

import { useState } from 'react';

const OPTIONS = [
  { value: 'event', label: 'Booking for an event', sub: 'Professional gigs & large venues', icon: '🎟️' },
  { value: 'private', label: 'Private occasion', sub: 'Intimate gatherings & celebrations', icon: '🎉' },
  { value: 'browsing', label: 'Just browsing', sub: 'Exploring East African artistry', icon: '👀' },
] as const;

export function OccasionBanner({ onDismiss }: { onDismiss: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion_type: selected }),
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
      onDismiss();
    }
  }

  return (
    <div className="w-full bg-surface border border-outline-variant/30 rounded-2xl p-6 mb-8 relative shadow-sm">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant text-sm"
      >
        ✕
      </button>

      <h3 className="text-headline-md font-headline-md text-on-surface mb-1">What brings you here?</h3>
      <p className="text-body-md font-body-md text-on-surface-variant mb-5">
        Helps us show you the most relevant artists.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
              selected === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container'
            }`}
          >
            <span className="text-2xl shrink-0">{opt.icon}</span>
            <div>
              <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">{opt.label}</p>
              <p className="text-caption font-caption text-on-surface-variant text-xs mt-0.5">{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className="bg-primary text-on-primary font-semibold px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
        <button onClick={onDismiss} className="text-sm text-on-surface-variant hover:underline">
          Skip for now
        </button>
      </div>
    </div>
  );
}
