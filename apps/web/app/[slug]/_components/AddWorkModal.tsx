'use client';

import { useState, useRef, useEffect } from 'react';
import type { Work } from '@/lib/services/artists';

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: Record<Work['type'], string[]> = {
  video: ['Live Show', 'Music Video', 'Short Film', 'Promo', 'Behind the Scenes', 'Interview'],
  audio: ['Album', 'Single', 'EP', 'Demo', 'Podcast', 'Live Recording'],
  image: ['Photography', 'Artwork', 'Event', 'Portrait', 'Installation'],
  document: ['Book', 'Anthology', 'Poetry Collection', 'Script', 'Article'],
};

function detectProvider(url: string): Work['provider'] | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/open\.spotify\.com/.test(url)) return 'spotify';
  if (/soundcloud\.com/.test(url)) return 'soundcloud';
  if (/instagram\.com/.test(url)) return 'instagram';
  return null;
}

async function uploadToCloudinary(file: File): Promise<{ secure_url: string } | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) return null;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'circle/works');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: fd });
  if (!res.ok) return null;
  return res.json();
}

function pdfThumbnail(url: string): string {
  return url.replace('/upload/', '/upload/w_600,f_jpg,pg_1/').replace(/\.pdf$/, '.jpg');
}

// ─── Type selector ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: Work['type']; label: string; icon: React.ReactNode; hint: string }[] = [
  {
    value: 'video', label: 'Video', hint: 'YouTube or TikTok',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
  },
  {
    value: 'audio', label: 'Audio', hint: 'Spotify or SoundCloud',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" /></svg>,
  },
  {
    value: 'image', label: 'Image', hint: 'Upload or Instagram',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
  },
  {
    value: 'document', label: 'Document', hint: 'PDF upload',
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
  },
];

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddWorkModal({
  onAdd,
  onClose,
  editWork,
}: {
  onAdd: (work: Work) => void;
  onClose: () => void;
  editWork?: Work;
}) {
  const [type, setType] = useState<Work['type'] | null>(editWork?.type ?? null);
  const [imageSource, setImageSource] = useState<'upload' | 'link'>('upload');

  const [url, setUrl] = useState(editWork?.media_url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(editWork?.thumbnail_url ?? '');
  const [title, setTitle] = useState(editWork?.title ?? '');
  const [category, setCategory] = useState(editWork?.category ?? '');
  const [customCategory, setCustomCategory] = useState('');
  const [year, setYear] = useState(String(editWork?.metadata?.year ?? ''));
  const [description, setDescription] = useState(editWork?.metadata?.description ?? '');

  const [fetching, setFetching] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleUrlBlur = async () => {
    if (!url.trim()) return;
    const provider = detectProvider(url);
    if (!provider) { setError('Unrecognised URL. Please use YouTube, TikTok, Spotify, SoundCloud, or Instagram.'); return; }
    setError('');
    setFetchFailed(false);

    setFetching(true);
    try {
      const res = await fetch('/api/oembed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (data.title && !title) setTitle(data.title);
      if (data.thumbnail_url && !thumbnailUrl) setThumbnailUrl(data.thumbnail_url);
      if (!data.title && !data.thumbnail_url) setFetchFailed(true);
    } catch { setFetchFailed(true); }
    finally { setFetching(false); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      if (!result) { setError('Upload failed. Check Cloudinary env vars.'); return; }
      setUrl(result.secure_url);
      if (type === 'image') setThumbnailUrl(result.secure_url);
      if (type === 'document') setThumbnailUrl(pdfThumbnail(result.secure_url));
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } finally { setUploading(false); }
  };

  const resolvedCategory = category === '__custom__' ? customCategory : category;

  const canSubmit = !!type && !!url && !!title && !!resolvedCategory && !uploading && !fetching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !type) return;

    const provider: Work['provider'] = (() => {
      const p = detectProvider(url);
      if (p) return p;
      return 'cloudinary';
    })();

    setSaving(true);
    setError('');
    try {
      const body = {
        title,
        category: resolvedCategory,
        type,
        provider,
        media_url: url,
        thumbnail_url: thumbnailUrl,
        metadata: { year: year ? Number(year) : undefined, description: description || undefined },
      };

      const endpoint = editWork ? `/api/artists/works/${editWork.id}` : '/api/artists/works';
      const method = editWork ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }

      onAdd(editWork ? { ...editWork, ...body, id: editWork.id } : data.work);
      onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const needsUrl = type === 'video' || type === 'audio' || (type === 'image' && imageSource === 'link');
  const needsUpload = type === 'document' || (type === 'image' && imageSource === 'upload');

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-md border-b border-outline-variant/20 sticky top-0 bg-surface-container-lowest rounded-t-2xl z-10">
          <h2 className="text-headline-md font-headline-md text-on-surface">
            {editWork ? 'Edit Work' : 'Add a Work'}
          </h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors p-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-md flex flex-col gap-5">
          {/* Error */}
          {error && <div className="rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-sm text-error">{error}</div>}

          {/* Step 1: Type */}
          <div className="grid grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setType(opt.value); setUrl(''); setThumbnailUrl(''); setTitle(''); setCategory(''); setFetchFailed(false); setError(''); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  type === opt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                }`}
              >
                {opt.icon}
                {opt.label}
                <span className="text-[10px] font-normal opacity-70 leading-tight text-center">{opt.hint}</span>
              </button>
            ))}
          </div>

          {type && (
            <>
              {/* Image sub-toggle */}
              {type === 'image' && (
                <div className="flex rounded-lg border border-outline-variant/30 overflow-hidden">
                  {(['upload', 'link'] as const).map((src) => (
                    <button key={src} type="button" onClick={() => { setImageSource(src); setUrl(''); setThumbnailUrl(''); }}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${imageSource === src ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                      {src === 'upload' ? '↑ Upload photo' : 'Instagram link'}
                    </button>
                  ))}
                </div>
              )}

              {/* URL input */}
              {needsUrl && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {type === 'video' ? 'YouTube or TikTok URL' : type === 'audio' ? 'Spotify or SoundCloud URL' : 'Instagram URL'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError(''); }}
                      onBlur={handleUrlBlur}
                      placeholder={type === 'video' ? 'https://youtube.com/...' : type === 'audio' ? 'https://open.spotify.com/...' : 'https://instagram.com/...'}
                      className="w-full pr-10"
                      disabled={fetching}
                    />
                    {fetching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {url && !fetching && (
                    <>
                      {thumbnailUrl && (
                        <div className="h-20 rounded-lg overflow-hidden">
                          <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {fetchFailed && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                          Couldn't load preview automatically: paste a thumbnail URL below.
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Thumbnail URL <span className="font-normal normal-case opacity-60">(optional)</span>
                        </label>
                        <input
                          type="url"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* File upload */}
              {needsUpload && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {type === 'document' ? 'Upload PDF' : 'Upload Image'}
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
                  >
                    {url ? (
                      type === 'image' ? (
                        <img src={url} alt="preview" className="h-24 object-cover rounded-lg" />
                      ) : (
                        <div className="flex items-center gap-2 text-primary">
                          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 12l2 2 4-4m-4.5 7.5h9" />
                          </svg>
                          <span className="text-sm font-medium">File uploaded</span>
                        </div>
                      )
                    ) : uploading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-outline" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-on-surface-variant text-center">
                          Click to upload {type === 'document' ? 'PDF' : 'image'}
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={type === 'document' ? '.pdf,application/pdf' : 'image/*'}
                    className="sr-only"
                    onChange={handleFile}
                    disabled={uploading}
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Echoes of Jinja" className="w-full" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full" required>
                      <option value="">Select…</option>
                      {CATEGORIES[type].map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">Other…</option>
                    </select>
                    {category === '__custom__' && (
                      <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Your category" className="w-full mt-1" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Year</label>
                    <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder={String(new Date().getFullYear())} min="1900" max="2099" className="w-full" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Short description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full resize-none" placeholder="Optional context for this work…" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-md border-t border-outline-variant/20 sticky bottom-0 bg-surface-container-lowest rounded-b-2xl flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-outline-variant rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Saving…' : editWork ? 'Save changes' : 'Add Work'}
          </button>
        </div>
      </form>
    </div>
  );
}
