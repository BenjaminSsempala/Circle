'use client';

import { useRef, useState } from 'react';

const MOODS = [
  { key: 'magical', emoji: '✨', label: 'Magical' },
  { key: 'meaningful', emoji: '❤️', label: 'Meaningful' },
  { key: 'energetic', emoji: '🎉', label: 'Energetic' },
  { key: 'professional', emoji: '🤝', label: 'Professional' },
  { key: 'inspiring', emoji: '🌱', label: 'Inspiring' },
] as const;

function fmtDate(date: string | null) {
  if (!date) return null;
  const d = date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function MemoryCard({
  cardRef, artistName, packageName, eventDate, mood,
}: {
  cardRef: React.RefObject<HTMLDivElement>;
  artistName: string;
  packageName: string;
  eventDate: string | null;
  mood: string;
}) {
  const m = MOODS.find((x) => x.key === mood);
  return (
    <div ref={cardRef} className="w-full aspect-square max-w-[360px] relative rounded-xl overflow-hidden shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#003B2D] via-[#005440] to-[#086b53]" />
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">You experienced</span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-['Playfair_Display'] text-4xl font-bold leading-none">{artistName}</h2>
          <p className="font-['Playfair_Display'] italic text-base opacity-90">{packageName}</p>
        </div>
        <div className="flex justify-between items-end border-t border-white/20 pt-3">
          <div>
            <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Date</div>
            <div className="text-sm">{fmtDate(eventDate) ?? '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase opacity-50 mb-1">Mood</div>
            <div className="text-sm">{m?.emoji} {m?.label}</div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-1/2 -right-10 rotate-90 text-[9px] font-mono tracking-widest opacity-20 text-white select-none">
        ENGERO · engero.art
      </div>
    </div>
  );
}

export function MemoryMomentClient({
  bookingId, artistName, artistSlug, artistPhoto, packageName, eventDate,
  existingMood, existingComment,
}: {
  bookingId: string;
  artistName: string;
  artistSlug: string;
  artistPhoto: string | null;
  packageName: string;
  eventDate: string | null;
  existingMood: string | null;
  existingComment: string | null;
}) {
  const [mood, setMood] = useState<string>(existingMood ?? '');
  const [comment, setComment] = useState(existingComment ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null!);

  async function handleSubmit() {
    if (!mood) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, comment: comment.trim() || null, stars: 5 }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json?.error ?? 'Failed to save.'); return; }
      setSubmitted(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `engero-memory-${artistName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  if (submitted) {
    const waText = `I just experienced ${packageName} with ${artistName} through Engero. Worth every moment. engero.art/${artistSlug}`;
    return (
      <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
        <MemoryCard cardRef={cardRef} artistName={artistName} packageName={packageName} eventDate={eventDate} mood={mood} />
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3 border border-primary text-primary rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            {downloading ? 'Preparing…' : 'Download memory card'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 border border-[#25D366] text-[#25D366] rounded-xl text-sm font-medium hover:bg-[#25D366]/5 transition-colors"
          >
            WhatsApp
          </a>
          <p className="text-center text-xs text-on-surface-variant">Sharing your memory helps other people discover {artistName}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col gap-6">
        <header className="text-center">
          {artistPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artistPhoto} alt={artistName} className="w-14 h-14 rounded-full object-cover mx-auto mb-4 border border-outline-variant/20" />
          )}
          <h1 className="font-['Playfair_Display'] text-2xl font-bold text-on-surface mb-2">How did the moment feel?</h1>
          <p className="text-sm text-on-surface-variant">Your response becomes a Circle Note on {artistName}&apos;s profile.</p>
        </header>

        {/* Mood grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(m.key)}
              className={`flex flex-col items-center justify-center py-5 px-3 rounded-xl border-2 transition-all min-h-[80px] ${
                mood === m.key
                  ? 'border-primary bg-[#E1F5EE]'
                  : 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container'
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-xs font-semibold text-on-surface">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Circle Note</label>
            <span className={`text-[10px] font-mono ${comment.length >= 130 ? 'text-[#c0392b]' : 'text-on-surface-variant'}`}>{comment.length}/140</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={140}
            rows={3}
            placeholder="Share a short reflection of your experience… (optional)"
            className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/40 resize-none"
          />
          <p className="text-[10px] text-on-surface-variant">Attributed with your first name only.</p>
        </div>

        {error && <div className="text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={!mood || submitting}
          className="w-full bg-[#C17A2A] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {submitting ? 'Saving…' : 'Save my memory →'}
        </button>
      </div>
    </div>
  );
}
