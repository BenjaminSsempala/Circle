'use client';

import { useState } from 'react';

const ART_FORM_OPTIONS = [
  { value: 'poet', label: 'Poet' },
  { value: 'musician', label: 'Musician' },
  { value: 'visual', label: 'Visual Artist' },
  { value: 'dancer', label: 'Dancer' },
  { value: 'digital', label: 'Videographer' },
  { value: 'theater', label: 'Actor' },
  { value: 'spoken-word', label: 'Spoken Word Artist' },
  { value: 'author', label: 'Author' },
  { value: 'cinematographer', label: 'Cinematographer' },
  { value: 'story-teller', label: 'Story Teller' },
];

const ART_FORM_LABELS: Record<string, string> = Object.fromEntries(
  ART_FORM_OPTIONS.map(({ value, label }) => [value, label])
);

type SocialKey = 'youtube' | 'spotify' | 'tiktok' | 'instagram' | 'soundcloud' | 'linkedin' | 'twitter' | 'website';

const SOCIAL_META: Record<SocialKey, { label: string; fill: string; path: string }> = {
  youtube: { label: 'YouTube', fill: '#FF0000', path: 'M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' },
  spotify: { label: 'Spotify', fill: '#1DB954', path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
  tiktok: { label: 'TikTok', fill: 'currentColor', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  instagram: { label: 'Instagram', fill: 'url(#ig-ph)', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z' },
  soundcloud: { label: 'SoundCloud', fill: '#FF5500', path: 'M1.175 12.225c-.015 0-.019.008-.019.023l.188 2.328-.188 2.167c0 .015.004.022.019.022.011 0 .015-.007.019-.022l.222-2.167-.222-2.328c-.004-.015-.008-.023-.019-.023zm11.4-5.095c-.188 0-.371.031-.543.086-.114-2.59-2.344-4.656-5.07-4.656-.63 0-1.231.118-1.779.332-.207.079-.261.161-.266.238v9.135c.005.079.066.142.147.149h7.511c.465 0 .843-.378.843-.843V11.65c0-.465-.378-.843-.843-.843z' },
  linkedin: { label: 'LinkedIn', fill: '#0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  twitter: { label: 'X / Twitter', fill: 'currentColor', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  website: { label: 'Website', fill: 'currentColor', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
};

type Artist = {
  name: string;
  tagline: string | null;
  art_forms: string[] | null;
  tags: string[] | null;
  city: string | null;
  country: string | null;
  profile_photo: string | null;
  social_links: Record<string, string> | null;
};

export function EditableProfileHeader({
  artist: initial,
  isOwner,
}: {
  artist: Artist;
  isOwner: boolean;
}) {
  const [artist, setArtist] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null); // 🔥 Added error tracker
  const [draft, setDraft] = useState({
    name: initial.name,
    tagline: initial.tagline ?? '',
    artForm: initial.art_forms?.[0] ?? '',
    tagsRaw: (initial.tags ?? []).join(', '),
    city: initial.city ?? '',
    country: initial.country ?? '',
  });

  const socialLinks = artist.social_links ?? {};
  const connectedSocials = Object.entries(socialLinks).filter(([, url]) => url?.trim());
  const primaryArtForm = artist.art_forms?.[0] ?? '';
  const artFormLabel = ART_FORM_LABELS[primaryArtForm] ?? primaryArtForm;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null); // Clear errors before processing a new selection

    // 🔥 5MB File size constraint validation rule (5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoError('Image size must be smaller than 5MB.');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return;

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      fd.append('folder', 'circle/profiles');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.secure_url) return;

      await fetch('/api/artists/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_photo: data.secure_url }),
      });
      setArtist((prev) => ({ ...prev, profile_photo: data.secure_url }));
    } 
    catch {
      setPhotoError('Failed to upload image. Please try again.');
    }
    finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = draft.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
    await fetch('/api/artists/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name,
        tagline: draft.tagline,
        art_forms: draft.artForm ? [draft.artForm] : [],
        tags,
        city: draft.city,
        country: draft.country,
      }),
    });
    setArtist((prev) => ({
      ...prev,
      name: draft.name,
      tagline: draft.tagline,
      art_forms: draft.artForm ? [draft.artForm] : [],
      tags,
      city: draft.city,
      country: draft.country,
    }));
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 🔥 Top Display Error Banner for User Feedback */}
      {photoError && (
        <div className="w-full flex items-center justify-between px-4 py-3 bg-error-container text-on-error-container rounded-lg border border-error/20 text-sm font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-error shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{photoError}</span>
          </div>
          <button onClick={() => setPhotoError(null)} className="text-on-error-container/70 hover:text-on-error-container p-1 transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <section className="flex flex-col md:flex-row items-center md:items-start gap-lg">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-primary-container/20 flex items-center justify-center">
            {artist.profile_photo ? (
              <img src={artist.profile_photo} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {isOwner && (
            <label className="absolute bottom-1 right-1 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center cursor-pointer shadow-md hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
            </label>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-center md:items-start gap-sm pt-md flex-1">
          {editing ? (
            /* ── Edit form ── */
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Tagline <span className="text-on-surface-variant/50 normal-case font-normal">· one line, optional</span></label>
                <input
                  value={draft.tagline}
                  onChange={(e) => setDraft((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="e.g. Spoken word poet blending tradition and technology"
                  className="w-full"
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Name</label>
                  <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Art Form</label>
                  <select value={draft.artForm} onChange={(e) => setDraft((p) => ({ ...p, artForm: e.target.value }))} className="w-full">
                    <option value="">Select</option>
                    {ART_FORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">City</label>
                  <input value={draft.city} onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))} className="w-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Country</label>
                  <input value={draft.country} onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))} className="w-full" />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Tags (comma-separated)</label>
                  <input value={draft.tagsRaw} onChange={(e) => setDraft((p) => ({ ...p, tagsRaw: e.target.value }))} placeholder="e.g. Poet, Digital Artist" className="w-full" />
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Read view ── */
            <>
              <div className="flex items-center gap-2 group">
                <h1 className="text-headline-xl font-headline-xl text-on-surface font-bold">{artist.name}</h1>
                {isOwner && (
                  <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary p-1 rounded-md">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>

              {(artFormLabel || artist.city) && (
                <div className="text-body-lg font-body-lg text-on-surface-variant font-medium">
                  {[artFormLabel, artist.city && artist.country ? `${artist.city}, ${artist.country}` : artist.city].filter(Boolean).join(' · ')}
                </div>
              )}

              {artist.tagline && (
                <p className="text-body-md font-body-md text-on-surface-variant italic mt-1">
                  {artist.tagline}
                </p>
              )}

              {Array.isArray(artist.tags) && artist.tags.length > 0 && (
                <div className="flex flex-wrap gap-xs mt-xs">
                  {artist.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-[#E1F5EE] text-primary rounded text-label-mono font-label-mono font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {connectedSocials.length > 0 && (
                <div className="flex items-center gap-sm mt-sm flex-wrap">
                  {connectedSocials.map(([platform, url]) => {
                    const meta = SOCIAL_META[platform as SocialKey];
                    if (!meta) return null;
                    return (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" title={meta.label}
                        className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          {platform === 'instagram' && (
                            <defs>
                              <linearGradient id="ig-ph" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f09433" />
                                <stop offset="100%" stopColor="#bc1888" />
                              </linearGradient>
                            </defs>
                          )}
                          <path fill={meta.fill} d={meta.path} />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}