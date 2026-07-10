'use client';

import { useState, useEffect } from 'react';
import type { GigPost } from '@/lib/services/gigs';

interface Package {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface Props {
  gig: GigPost;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyToGigPanel({ gig, isOpen, onClose }: Props) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [referencedPackageId, setReferencedPackageId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Fetch this artist's active packages
    fetch('/api/packages?active=true')
      .then((r) => r.json())
      .then((data) => {
        const pkgs = data?.packages ?? data?.data ?? [];
        setPackages(pkgs);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!message.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gigs/${gig.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          referencedPackageId: referencedPackageId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function formatBudget(budget: number, currency: string) {
    return `${currency} ${Number(budget).toLocaleString()}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full md:w-[420px] max-h-[90vh] md:max-h-none md:h-full bg-[#fcf9f8] rounded-t-2xl md:rounded-none shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 flex-shrink-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-0.5">Apply to gig</p>
            <div className="font-sans font-bold text-on-surface">{gig.title}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary/5 text-on-surface-variant"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {submitted ? (
            /* Confirmation state */
            <div className="flex flex-col items-center text-center gap-4 py-10">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,84,64,0.07)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M4.5 12.75l6 6 9-13.5" stroke="#005440" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="font-sans font-bold text-lg text-on-surface">Application sent!</div>
              <div className="font-sans text-sm text-on-surface-variant max-w-xs">
                Your pitch has been sent to the organiser. You&apos;ll hear back if you&apos;re selected.
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-sm text-primary font-semibold hover:underline"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Gig summary card */}
              <div className="rounded-xl border border-primary/10 bg-white p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Gig details</div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div>
                    <span className="text-on-surface-variant text-xs">Budget</span>
                    <div className="font-bold text-primary">{formatBudget(gig.budget, gig.currency)}</div>
                  </div>
                  <div>
                    <span className="text-on-surface-variant text-xs">Duration</span>
                    <div className="font-semibold text-on-surface">{gig.slot_duration}</div>
                  </div>
                  {gig.gig_date && (
                    <div>
                      <span className="text-on-surface-variant text-xs">Date</span>
                      <div className="font-semibold text-on-surface">{gig.gig_date}</div>
                    </div>
                  )}
                  {gig.venue && (
                    <div>
                      <span className="text-on-surface-variant text-xs">Venue</span>
                      <div className="font-semibold text-on-surface">{gig.venue}</div>
                    </div>
                  )}
                </div>
                {gig.discipline.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gig.discipline.map((d) => (
                      <span key={d} className="bg-[#E1F5EE] text-primary px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Package reference (only if artist has active packages) */}
              {packages.length > 0 && (
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                    Reference a package (optional)
                  </label>
                  <select
                    value={referencedPackageId}
                    onChange={(e) => setReferencedPackageId(e.target.value)}
                    className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="">None — pitch without a package</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.currency} {Number(p.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pitch textarea */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Tell them why you&apos;re the right fit *
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe your experience, what you'll bring to this event, and why you're perfect for this gig…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={300}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 resize-none"
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-[11px] ${message.length > 280 ? 'text-[#c0392b]' : 'text-on-surface-variant'}`}>
                    {message.length}/300
                  </span>
                  {message.length === 0 && (
                    <span className="text-[11px] text-on-surface-variant">Required</span>
                  )}
                </div>
              </div>

              {error && (
                <div className="font-sans text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-5 py-4 border-t border-primary/10 flex-shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {submitting ? 'Sending…' : 'Send application'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
