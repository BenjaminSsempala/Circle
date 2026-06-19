'use client';

import { useState } from 'react';
import type { GigPost } from '@/lib/services/gigs';

const DISCIPLINES = ['Musician', 'Dancer', 'Poet', 'Visual Artist', 'Spoken Word', 'Actor', 'Videographer'];
const SLOT_DURATIONS = ['30 min', '45 min', '1 hr', '2 hrs', 'Half day', 'Full day'];
const CURRENCIES = ['UGX', 'KES', 'TZS', 'USD', 'GBP'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (gig: GigPost) => void;
}

export function PostGigPanel({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [slotDuration, setSlotDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('UGX');

  // Step 2 fields
  const [gigDate, setGigDate] = useState('');
  const [venue, setVenue] = useState('');
  const [technicalRequirements, setTechnicalRequirements] = useState('');
  const [description, setDescription] = useState('');

  // Step 3 fields
  const [visibility, setVisibility] = useState<'public' | 'targeted'>('public');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function canProceedStep1() {
    return title.trim() && disciplines.length > 0 && slotDuration && Number(budget) > 0;
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          discipline: disciplines,
          slot_duration: slotDuration,
          budget: Number(budget),
          currency,
          technical_requirements: technicalRequirements.trim() || undefined,
          description: description.trim() || undefined,
          gig_date: gigDate || undefined,
          venue: venue.trim() || undefined,
          visibility,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      onCreated(json.gigPost as GigPost);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full md:w-[460px] max-h-[90vh] md:max-h-none md:h-full bg-[#fcf9f8] rounded-t-2xl md:rounded-none shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 flex-shrink-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-0.5">
              Step {step} of 3
            </p>
            <div className="font-sans font-bold text-on-surface text-lg">
              {step === 1 ? 'The gig' : step === 2 ? 'Details' : 'Visibility'}
            </div>
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

        {/* Progress bar */}
        <div className="h-1 bg-primary/10 flex-shrink-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Step 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  What&apos;s the occasion? *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opening night at Kampala Arts Festival"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                />
              </div>

              {/* Discipline chips */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Discipline(s) needed *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiscipline(d)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        disciplines.includes(d)
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot duration */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Slot duration *
                </label>
                <div className="flex flex-wrap gap-2">
                  {SLOT_DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSlotDuration(d)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        slotDuration === d
                          ? 'bg-primary text-white'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Budget *
                </label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border border-outline-variant/40 rounded-xl px-3 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="e.g. 500000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min={1}
                    className="flex-1 border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Date (optional)
                </label>
                <input
                  type="date"
                  value={gigDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setGigDate(e.target.value)}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Venue (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kampala Serena Hotel, Rooftop"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Technical requirements (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. PA system needed, stage dimensions 6×4m, outdoor power access"
                  value={technicalRequirements}
                  onChange={(e) => setTechnicalRequirements(e.target.value)}
                  maxLength={500}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 resize-none"
                />
                <p className="text-[11px] text-on-surface-variant text-right mt-1">
                  {technicalRequirements.length}/500
                </p>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-1.5 block">
                  Occasion notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell artists about the event, audience, vibe — anything that helps them pitch well."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 text-sm text-on-surface bg-white focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50 resize-none"
                />
                <p className="text-[11px] text-on-surface-variant text-right mt-1">
                  {description.length}/500
                </p>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-sm text-on-surface-variant">
                Choose who can see and apply to this gig.
              </p>

              {/* Public card */}
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`text-left rounded-2xl border-2 p-5 transition-all ${
                  visibility === 'public'
                    ? 'border-primary bg-[#E1F5EE]'
                    : 'border-outline-variant/30 bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${visibility === 'public' ? 'border-primary' : 'border-outline-variant/60'}`}>
                    {visibility === 'public' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-on-surface text-sm mb-1">Public</div>
                    <div className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      Visible to all artists on the Gig Feed. Any matching artist can apply.
                    </div>
                  </div>
                </div>
              </button>

              {/* Targeted card */}
              <button
                type="button"
                onClick={() => setVisibility('targeted')}
                className={`text-left rounded-2xl border-2 p-5 transition-all ${
                  visibility === 'targeted'
                    ? 'border-primary bg-[#E1F5EE]'
                    : 'border-outline-variant/30 bg-white hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${visibility === 'targeted' ? 'border-primary' : 'border-outline-variant/60'}`}>
                    {visibility === 'targeted' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-on-surface text-sm mb-1">Targeted</div>
                    <div className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      Only visible to artists you personally invite. After posting, you can go to Discover and invite specific artists.
                    </div>
                  </div>
                </div>
              </button>

              {/* Summary */}
              <div className="rounded-xl border border-primary/10 bg-white p-4 mt-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-3">Gig summary</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Title</span>
                    <span className="font-semibold text-on-surface text-right max-w-[200px] truncate">{title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Disciplines</span>
                    <span className="font-semibold text-on-surface">{disciplines.join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Duration</span>
                    <span className="font-semibold text-on-surface">{slotDuration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Budget</span>
                    <span className="font-semibold text-primary">{currency} {Number(budget).toLocaleString()}</span>
                  </div>
                  {gigDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Date</span>
                      <span className="font-semibold text-on-surface">{gigDate}</span>
                    </div>
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

        {/* Footer nav */}
        <div className="px-5 py-4 border-t border-primary/10 flex-shrink-0 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !canProceedStep1()}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {submitting ? 'Posting…' : 'Post gig'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
