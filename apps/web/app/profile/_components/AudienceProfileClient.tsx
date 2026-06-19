'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OCCASION_LABELS: Record<string, { label: string; icon: string }> = {
  event:    { label: 'Booking for an event',   icon: '🎟️' },
  private:  { label: 'Private occasion',        icon: '🎉' },
  browsing: { label: 'Just browsing',           icon: '👀' },
};

interface Props {
  user: { id: string; email: string; fullName: string };
  occasionType: string | null;
  savedCount: number;
  bookingCount: number;
}

export function AudienceProfileClient({ user, occasionType, savedCount, bookingCount }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.fullName);
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [occasion, setOccasion] = useState(occasionType);
  const [editingOccasion, setEditingOccasion] = useState(false);

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  async function handleSaveName() {
    setSaving(true);
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: name }),
    });
    setSaving(false);
    setEditingName(false);
  }

  async function handleSaveOccasion(value: string) {
    setOccasion(value);
    setEditingOccasion(false);
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion_type: value }),
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/discover');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="text-headline-md font-headline-md font-bold text-primary">Circle</Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/discover" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Explore</Link>
            <Link href="/my-circle" className="text-on-surface-variant text-sm hover:text-primary transition-colors">My Circle</Link>
            <Link href="/saved" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Saved</Link>
            <Link href="/bookings" className="text-on-surface-variant text-sm hover:text-primary transition-colors">My bookings</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-primary font-bold text-3xl">{initials}</span>
          </div>

          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface text-base focus:outline-none focus:border-primary text-center"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="bg-primary text-on-primary text-sm font-semibold px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditingName(false); setName(user.fullName); }}
                className="text-on-surface-variant text-sm px-2"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-headline-md font-headline-md text-on-surface">
                {name || 'Your name'}
              </h1>
              <button
                onClick={() => setEditingName(true)}
                className="text-on-surface-variant hover:text-primary transition-colors"
                title="Edit name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-caption font-caption text-on-surface-variant mt-1">{user.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link
            href="/saved"
            className="bg-surface border border-outline-variant/30 rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <p className="text-headline-lg font-headline-lg text-primary">{savedCount}</p>
            <p className="text-caption font-caption text-on-surface-variant mt-1">Saved artists</p>
          </Link>
          <Link
            href="/bookings"
            className="bg-surface border border-outline-variant/30 rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <p className="text-headline-lg font-headline-lg text-primary">{bookingCount}</p>
            <p className="text-caption font-caption text-on-surface-variant mt-1">Bookings</p>
          </Link>
        </div>

        {/* Occasion preference */}
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">What brings you here?</p>
            <button
              onClick={() => setEditingOccasion((v) => !v)}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {editingOccasion ? 'Cancel' : 'Change'}
            </button>
          </div>

          {editingOccasion ? (
            <div className="flex flex-col gap-2">
              {Object.entries(OCCASION_LABELS).map(([value, { label, icon }]) => (
                <button
                  key={value}
                  onClick={() => handleSaveOccasion(value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    occasion === value
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-label-mono font-label-mono text-on-surface text-sm">{label}</span>
                  {occasion === value && (
                    <span className="ml-auto text-primary text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          ) : occasion ? (
            <div className="flex items-center gap-3">
              <span className="text-xl">{OCCASION_LABELS[occasion]?.icon}</span>
              <span className="text-body-md font-body-md text-on-surface">{OCCASION_LABELS[occasion]?.label}</span>
            </div>
          ) : (
            <p className="text-caption font-caption text-on-surface-variant">Not set yet</p>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full border border-outline-variant/40 text-on-surface-variant font-semibold py-3 rounded-2xl hover:bg-surface-container hover:text-error transition-colors text-sm"
        >
          Sign out
        </button>
      </main>
    </div>
  );
}
