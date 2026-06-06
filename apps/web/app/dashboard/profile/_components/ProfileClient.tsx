'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/upload';

type Artist = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  profile_photo: string | null;
  art_forms: string[];
  tags: string[] | null;
  city: string | null;
  country: string | null;
  actives_since: number | null;
  social_links: Record<string, string> | null;
};

type FormState = {
  name: string;
  tagline: string;
  bio: string;
  art_forms: string;
  tags: string;
  city: string;
  country: string;
  actives_since: string;
  slug: string;
  social_instagram: string;
  social_youtube: string;
  social_tiktok: string;
  social_spotify: string;
  social_soundcloud: string;
  social_twitter: string;
  social_linkedin: string;
  social_website: string;
};

function artistToForm(a: Artist): FormState {
  const sl = a.social_links ?? {};
  return {
    name: a.name,
    tagline: a.tagline ?? '',
    bio: a.bio ?? '',
    art_forms: (a.art_forms ?? []).join(', '),
    tags: (a.tags ?? []).join(', '),
    city: a.city ?? '',
    country: a.country ?? '',
    actives_since: a.actives_since ? String(a.actives_since) : '',
    slug: a.slug,
    social_instagram: sl.instagram ?? '',
    social_youtube: sl.youtube ?? '',
    social_tiktok: sl.tiktok ?? '',
    social_spotify: sl.spotify ?? '',
    social_soundcloud: sl.soundcloud ?? '',
    social_twitter: sl.twitter ?? '',
    social_linkedin: sl.linkedin ?? '',
    social_website: sl.website ?? '',
  };
}

function isDirty(a: FormState, b: FormState) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

function SlugField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value) { setStatus('idle'); return; }
    setStatus('checking');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artists/check-slug?slug=${encodeURIComponent(value)}`);
        const data = await res.json();
        setStatus(data.available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  return (
    <div>
      <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Your link</label>
      <div className="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden focus-within:border-primary">
        <span className="px-3 py-2.5 bg-surface-container text-on-surface-variant text-sm border-r border-outline-variant/30 whitespace-nowrap">
          thecircle.co/
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          className="flex-1 px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none"
          placeholder="your-slug"
        />
        <span className="px-3 py-2.5">
          {status === 'checking' && <span className="text-on-surface-variant text-xs">…</span>}
          {status === 'available' && <span className="text-primary text-base">✓</span>}
          {status === 'taken' && <span className="text-error text-xs font-semibold">Taken</span>}
        </span>
      </div>
    </div>
  );
}

export function ProfileClient({ artist }: { artist: Artist }) {
  const [form, setForm] = useState<FormState>(() => artistToForm(artist));
  const [saved, setSaved] = useState<FormState>(() => artistToForm(artist));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(artist.profile_photo ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = isDirty(form, saved) || photoUrl !== (artist.profile_photo ?? '');

  function update(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError('');
    try {
      const artForms = form.art_forms.split(',').map((s) => s.trim()).filter(Boolean);
      const tags = form.tags.split(',').map((s) => s.trim()).filter(Boolean);

      const body: Record<string, unknown> = {
        name: form.name,
        tagline: form.tagline,
        bio: form.bio,
        art_forms: artForms,
        tags,
        city: form.city,
        country: form.country,
        slug: form.slug,
      };

      if (photoUrl !== (artist.profile_photo ?? '')) body.profile_photo = photoUrl;

      const socials: Record<string, string> = {};
      const socialKeys = ['instagram', 'youtube', 'tiktok', 'spotify', 'soundcloud', 'twitter', 'linkedin', 'website'] as const;
      for (const k of socialKeys) {
        const v = form[`social_${k}` as keyof FormState];
        if (v) socials[k] = v;
      }
      body.social_links = socials;

      const res = await fetch('/api/artists/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? 'Save failed');
        return;
      }
      setSaved({ ...form });
    } catch {
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }, [form, photoUrl, artist.profile_photo]);

  function handleDiscard() {
    setForm(saved);
    setPhotoUrl(artist.profile_photo ?? '');
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'circle/profiles');
      if (url) setPhotoUrl(url);
    } finally {
      setUploading(false);
    }
  }

  const inputClass = 'w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary';
  const labelClass = 'block text-label-mono font-label-mono text-on-surface text-sm mb-1.5';

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-24">
        {/* ── Form ── */}
        <div className="lg:col-span-2 flex flex-col gap-7">

          {/* Identity */}
          <section>
            <h2 className="flex items-center gap-2 text-label-mono font-label-mono text-on-surface text-sm font-bold uppercase tracking-wider mb-4">
              <span>👤</span> Identity
            </h2>

            {/* Photo upload */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-20 h-20 rounded-full bg-surface-container border-2 border-outline-variant/30 overflow-hidden flex items-center justify-center shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-on-surface-variant text-2xl">👤</span>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-primary text-sm font-semibold border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
                <p className="text-caption font-caption text-on-surface-variant mt-1">JPG or PNG, max 5 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Artist Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} placeholder="Your full name" />
            </div>

            <div>
              <label className={labelClass}>Tagline <span className="text-on-surface-variant/50 normal-case font-normal">— one line, optional</span></label>
              <input
                value={form.tagline}
                onChange={(e) => update('tagline', e.target.value)}
                className={inputClass}
                placeholder="e.g. Spoken word poet blending tradition and technology"
                maxLength={120}
              />
            </div>

            <div className="mt-4">
              <label className={labelClass}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                rows={5}
                placeholder="Tell your story…"
                className={`${inputClass} resize-none`}
              />
            </div>
          </section>

          {/* Details */}
          <section>
            <h2 className="flex items-center gap-2 text-label-mono font-label-mono text-on-surface text-sm font-bold uppercase tracking-wider mb-4">
              <span>📋</span> Details
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Art Form</label>
                <input value={form.art_forms} onChange={(e) => update('art_forms', e.target.value)} className={inputClass} placeholder="Musician, Painter, …" />
                <p className="text-caption font-caption text-on-surface-variant mt-1">Comma-separated</p>
              </div>
              <div>
                <label className={labelClass}>Tags</label>
                <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className={inputClass} placeholder="Acoustic, LiveMusic, …" />
                <p className="text-caption font-caption text-on-surface-variant mt-1">Comma-separated</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input value={form.city} onChange={(e) => update('city', e.target.value)} className={inputClass} placeholder="Nairobi" />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass} placeholder="Kenya" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Active Since</label>
                <input type="number" value={form.actives_since} onChange={(e) => update('actives_since', e.target.value)} className={inputClass} placeholder="2018" />
              </div>
            </div>
          </section>

          {/* Your link */}
          <section>
            <h2 className="flex items-center gap-2 text-label-mono font-label-mono text-on-surface text-sm font-bold uppercase tracking-wider mb-4">
              <span>🔗</span> Your link
            </h2>
            <SlugField value={form.slug} onChange={(v) => update('slug', v)} />
          </section>

          {/* Presence */}
          <section>
            <h2 className="flex items-center gap-2 text-label-mono font-label-mono text-on-surface text-sm font-bold uppercase tracking-wider mb-4">
              <span>📡</span> Presence
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'social_instagram', label: 'Instagram', placeholder: '@yourname' },
                { key: 'social_youtube', label: 'YouTube', placeholder: 'Channel URL' },
                { key: 'social_tiktok', label: 'TikTok', placeholder: '@yourname' },
                { key: 'social_spotify', label: 'Spotify', placeholder: 'Artist URL' },
                { key: 'social_soundcloud', label: 'SoundCloud', placeholder: 'Profile URL' },
                { key: 'social_twitter', label: 'X / Twitter', placeholder: '@yourhandle' },
                { key: 'social_linkedin', label: 'LinkedIn', placeholder: 'Profile URL' },
                { key: 'social_website', label: 'Website', placeholder: 'https://yourwebsite.com' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    value={form[key as keyof FormState]}
                    onChange={(e) => update(key as keyof FormState, e.target.value)}
                    className={inputClass}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right sidebar: profile link ── */}
        <div className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-4">
            <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5">
              <p className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3">
                Your public profile
              </p>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={form.name}
                  className="w-full aspect-square object-cover rounded-xl mb-4"
                />
              )}
              {!photoUrl && (
                <div className="w-full aspect-square bg-surface-container rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-on-surface-variant/40 text-4xl">👤</span>
                </div>
              )}
              <p className="text-label-mono font-label-mono text-on-surface font-semibold mb-0.5">
                {form.name || 'Your name'}
              </p>
              {(form.city || form.country) && (
                <p className="text-caption font-caption text-on-surface-variant mb-3">
                  {[form.city, form.country].filter(Boolean).join(', ')}
                </p>
              )}
              <Link
                href={`/${artist.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-primary/30 text-primary text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View live profile
              </Link>
            </div>

            <div className="bg-surface-container rounded-xl p-4">
              <p className="text-caption font-caption text-on-surface-variant text-xs">
                Changes save to your live profile immediately after clicking <span className="font-semibold text-on-surface">Save changes</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-surface border-t border-outline-variant/30 p-4 flex items-center justify-between gap-4 z-30 shadow-lg">
          <p className="text-caption font-caption text-on-surface-variant hidden sm:block">You have unsaved changes.</p>
          {saveError && <p className="text-error text-sm flex-1">{saveError}</p>}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleDiscard}
              className="border border-outline-variant/40 text-on-surface px-4 py-2 rounded-lg text-label-mono font-label-mono text-sm hover:bg-surface-container transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg text-label-mono font-label-mono text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
