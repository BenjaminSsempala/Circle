'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lbl, Btn, Textarea } from './ui';

const MAX_CLAUSES = 3;

export function ClauseEditor({ bookingId, initialClauses }: { bookingId: string; initialClauses: string[] }) {
  const router = useRouter();
  const [clauses, setClauses] = useState<string[]>(initialClauses.length ? initialClauses : []);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, value: string) {
    setClauses((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  }

  function add() {
    if (clauses.length >= MAX_CLAUSES) return;
    setClauses((prev) => [...prev, '']);
  }

  function remove(i: number) {
    setClauses((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/contract/clauses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauses: clauses.map((c) => c.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Failed to save clauses.');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to save clauses.');
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/contract/send`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Failed to send contract.');
        return;
      }
      router.refresh();
    } catch {
      setError('Failed to send contract.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-6">
      <Lbl>Additional clauses (optional, up to {MAX_CLAUSES})</Lbl>
      <div className="flex flex-col gap-2 mb-3">
        {clauses.map((clause, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Textarea
              rows={2}
              value={clause}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Clause ${i + 1}…`}
            />
            <button onClick={() => remove(i)} className="p-2 mt-1 rounded-lg text-on-surface-variant hover:text-[#c0392b] hover:bg-[#c0392b]/5 transition-colors flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {clauses.length < MAX_CLAUSES && (
          <button onClick={add} className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary hover:opacity-80 text-left">
            + Add clause
          </button>
        )}
      </div>

      {error && (
        <div className="font-sans text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      <div className="flex gap-2">
        <Btn variant="tealOutline" small onClick={save} disabled={saving || sending}>
          {saving ? 'Saving…' : 'Save clauses'}
        </Btn>
        <Btn variant="amber" full onClick={send} disabled={saving || sending}>
          {sending ? 'Sending…' : 'Send contract to client'}
        </Btn>
      </div>
    </div>
  );
}
