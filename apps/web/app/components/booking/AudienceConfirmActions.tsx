'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AudienceConfirmActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body?: object) {
    setLoading(path);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) { setError(json?.error ?? 'Something went wrong.'); return; }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2">{error}</div>}
      <button
        onClick={() => call('confirm')}
        disabled={loading !== null}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading === 'confirm' ? 'Confirming…' : 'Yes, it was great'}
      </button>
      {showDispute ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Briefly describe what went wrong…"
            rows={3}
            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => call('dispute', { note })}
              disabled={loading !== null}
              className="flex-1 border border-[#c0392b] text-[#c0392b] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#c0392b]/5 transition-colors disabled:opacity-50"
            >
              {loading === 'dispute' ? 'Submitting…' : 'Submit concern'}
            </button>
            <button onClick={() => setShowDispute(false)} className="px-4 text-sm text-on-surface-variant hover:text-on-surface">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowDispute(true)}
          className="text-sm text-on-surface-variant hover:text-[#c0392b] transition-colors"
        >
          Something went wrong
        </button>
      )}
    </div>
  );
}
