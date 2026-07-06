'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NavbarProfileClient from './NavbarProfileClient';

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
      {/* Mobile-Responsive Universal Header */}
      <NavbarProfileClient />

      {/* Main Form Box Content — flex-1 maintains viewport alignment */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 md:py-10 flex flex-col justify-center">
        <div className="w-full my-auto">
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
                <h1 className="text-headline-sm sm:text-headline-md font-headline-md text-on-surface text-center">
                  {name || 'Your name'}
                </h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                  title="Edit name"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-xs md:text-caption font-caption text-on-surface-variant mt-1 text-center break-all px-2">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6 w-full">
            <Link
              href="/saved"
              className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <p className="text-2xl sm:text-headline-lg font-headline-lg text-primary">{savedCount}</p>
              <p className="text-xs md:text-caption font-caption text-on-surface-variant mt-1">Saved artists</p>
            </Link>
            <Link
              href="/bookings"
              className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 text-center hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <p className="text-2xl sm:text-headline-lg font-headline-lg text-primary">{bookingCount}</p>
              <p className="text-xs md:text-caption font-caption text-on-surface-variant mt-1">Bookings</p>
            </Link>
          </div>

          {/* Occasion preference */}
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 mb-6 w-full">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-on-surface text-xs sm:text-sm font-semibold tracking-wide">What brings you here?</p>
              <button
                onClick={() => setEditingOccasion((v) => !v)}
                className="text-primary text-xs font-semibold hover:underline flex-shrink-0"
              >
                {editingOccasion ? 'Cancel' : 'Change'}
              </button>
            </div>

            {editingOccasion ? (
              <div className="flex flex-col gap-2 w-full">
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
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <span className="text-on-surface text-xs sm:text-sm">{label}</span>
                    {occasion === value && (
                      <span className="ml-auto text-primary text-xs font-bold flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            ) : occasion ? (
              <div className="flex items-center gap-3 w-full">
                <span className="text-xl flex-shrink-0">{OCCASION_LABELS[occasion]?.icon}</span>
                <span className="text-xs sm:text-sm text-on-surface">{OCCASION_LABELS[occasion]?.label}</span>
              </div>
            ) : (
              <p className="text-xs md:text-caption font-caption text-on-surface-variant">Not set yet</p>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full border border-outline-variant/40 text-on-surface-variant font-semibold py-3 rounded-2xl hover:bg-surface-container hover:text-error transition-colors text-sm"
          >
            Sign out
          </button>
        </div>
      </main>

      {/* Structured Viewport Base Footer Alignment */}
      <footer className="border-t border-outline-variant/20 py-6 md:py-8 px-4 sm:px-6 md:px-10 shrink-0 w-full bg-surface">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-xs md:text-caption font-caption text-on-surface-variant">© 2026 Engero · Connecting African Artistry.</p>
          <div className="flex gap-6 text-xs md:text-caption">
            {['Privacy', 'Terms', 'Support'].map((item) => (
              <a key={item} href="#" className="font-caption text-on-surface-variant hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}