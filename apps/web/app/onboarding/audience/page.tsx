'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const OPTIONS = [
  { value: 'event', label: 'Booking for an event', sub: 'Professional gigs & large venues', icon: '🎟️', color: 'bg-primary/10' },
  { value: 'private', label: 'Private occasion', sub: 'Intimate gatherings & celebrations', icon: '💚', color: 'bg-tertiary/10' },
  { value: 'browsing', label: 'Just browsing', sub: 'Exploring East African artistry', icon: '👀', color: 'bg-secondary/10' },
] as const;

export default function AudienceOnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    try {
      if (selected) {
        await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ occasion_type: selected }),
        });
      }
    } catch { /* ignore */ } finally {
      router.push('/discover');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">What brings you here?</h1>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Helps us show you the most relevant artists.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                selected === opt.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container'
              }`}
            >
              <div className={`w-11 h-11 rounded-full ${opt.color} flex items-center justify-center shrink-0 text-xl`}>
                {opt.icon}
              </div>
              <div>
                <p className="text-label-mono font-label-mono text-on-surface font-semibold">{opt.label}</p>
                <p className="text-caption font-caption text-on-surface-variant text-xs mt-0.5">{opt.sub}</p>
              </div>
              {selected === opt.value && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full bg-primary text-on-primary font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mb-3"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>

        <div className="text-center">
          <Link
            href="/discover"
            className="text-sm font-label-mono font-label-mono text-on-surface-variant hover:text-primary transition-colors"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
