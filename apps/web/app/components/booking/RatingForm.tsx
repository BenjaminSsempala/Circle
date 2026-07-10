'use client';

import { useState } from 'react';
import { Btn } from './ui';

function Star({ filled, hovered, onClick, onEnter, onLeave }: {
  filled: boolean; hovered: boolean;
  onClick: () => void; onEnter: () => void; onLeave: () => void;
}) {
  const active = filled || hovered;
  return (
    <button type="button" onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave} className="p-0.5 transition-transform hover:scale-110">
      <svg width="28" height="28" viewBox="0 0 24 24" fill={active ? '#d98620' : 'none'} stroke={active ? '#d98620' : '#6f7a74'} strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

export function RatingForm({
  bookingId,
  artistName,
  existingReview,
}: {
  bookingId: string;
  artistName: string;
  existingReview: { stars: number; comment: string | null } | null;
}) {
  const [stars, setStars] = useState(existingReview?.stars ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [submitted, setSubmitted] = useState(!!existingReview);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= stars ? '#d98620' : 'none'} stroke={s <= stars ? '#d98620' : '#6f7a74'} strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        {comment && <p className="text-sm text-on-surface-variant italic">&ldquo;{comment}&rdquo;</p>}
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Review submitted: thank you</div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!stars) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, comment: comment.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json?.error ?? 'Failed to submit review.'); return; }
      setSubmitted(true);
    } catch {
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="font-sans text-sm text-on-surface-variant">How was your experience with {artistName}?</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            filled={s <= stars}
            hovered={s <= hover}
            onClick={() => setStars(s)}
            onEnter={() => setHover(s)}
            onLeave={() => setHover(0)}
          />
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="Optional: share what made it great or what could be better…"
        className="w-full bg-white border border-primary/15 rounded-lg px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary/40 resize-none"
      />
      {error && <div className="font-sans text-sm text-[#c0392b]">{error}</div>}
      <Btn variant="amber" onClick={handleSubmit} disabled={submitting || !stars}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </Btn>
    </div>
  );
}
