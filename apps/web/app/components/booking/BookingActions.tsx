'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Btn, Banner } from './ui';
import type { ProductType, BookingState } from '@/lib/services/bookings';

export function BookingActions({
  bookingId,
  state,
  role,
  productType,
  artistConfirmedAt,
  audienceConfirmedAt,
}: {
  bookingId: string;
  state: BookingState;
  role: 'artist' | 'audience';
  productType: ProductType;
  artistConfirmedAt: string | null;
  audienceConfirmedAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [showDispute, setShowDispute] = useState(false);

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
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong.');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  const myConfirmed = role === 'artist' ? artistConfirmedAt : audienceConfirmedAt;

  const canCancel = state === 'CONTRACT_SIGNED' || state === 'PAYMENT_PENDING' || state === 'PAYMENT_HELD'
    || (state === 'REQUESTED' && role === 'audience');
  const canDispute = state === 'CONFIRMING';

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="font-sans text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2">{error}</div>
      )}

      {state === 'REQUESTED' && role === 'artist' && (
        <div className="flex gap-2">
          <Btn variant="amber" full onClick={() => call('accept')} disabled={loading !== null}>
            {loading === 'accept' ? 'Accepting…' : 'Accept booking'}
          </Btn>
          <Btn variant="outline" full onClick={() => call('decline')} disabled={loading !== null}>
            {loading === 'decline' ? 'Declining…' : 'Decline'}
          </Btn>
        </div>
      )}

      {state === 'CONTRACT_DRAFT' && (
        role === 'artist' ? (
          <Link href={`/booking/${bookingId}/contract`}>
            <Btn variant="amber" full>Review & send contract</Btn>
          </Link>
        ) : (
          <Banner variant="teal" text="The artist is preparing your contract — you'll be notified once it's ready to review." />
        )
      )}

      {state === 'CONTRACT_SENT' && (
        <Link href={`/booking/${bookingId}/contract`}>
          <Btn variant="amber" full>
            {role === 'audience' ? 'Review & sign contract' : 'View contract'}
          </Btn>
        </Link>
      )}

      {state === 'AUDIENCE_UPLOADED' && role === 'artist' && (
        <Link href={`/booking/${bookingId}/contract`}>
          <Btn variant="amber" full>Review & countersign</Btn>
        </Link>
      )}

      {state === 'AUDIENCE_UPLOADED' && role === 'audience' && (
        <>
          <Banner variant="teal" text="Your signed copy has been received — waiting for the artist's countersignature." />
          <Link href={`/booking/${bookingId}/contract`}>
            <Btn variant="tealOutline" full>View contract</Btn>
          </Link>
        </>
      )}

      {state === 'CONTRACT_SIGNED' && (
        <>
          <Banner variant="green" text="Contract complete. Payment processing is coming soon — we'll notify you when it's ready." />
          <Link href={`/booking/${bookingId}/contract`}>
            <Btn variant="tealOutline" full>View signed contract</Btn>
          </Link>
        </>
      )}

      {state === 'GIG_ACTIVE' && role === 'artist' && productType === 'service' && (
        <Btn variant="amber" full onClick={() => call('checkin')} disabled={loading !== null}>
          {loading === 'checkin' ? 'Checking in…' : 'Check in at venue'}
        </Btn>
      )}

      {state === 'CONFIRMING' && (
        myConfirmed ? (
          <Banner variant="amber" text="Waiting for the other party to confirm completion." />
        ) : (
          <Btn variant="amber" full onClick={() => call('confirm')} disabled={loading !== null}>
            {loading === 'confirm' ? 'Confirming…' : 'Confirm completion'}
          </Btn>
        )
      )}

      {(canCancel || canDispute) && (
        <div className="flex flex-col gap-2 mt-1">
          {canDispute && (
            showDispute ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Briefly describe the issue…"
                  rows={3}
                  className="w-full bg-white border border-primary/15 rounded-lg px-3.5 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary/40 resize-none"
                />
                <div className="flex gap-2">
                  <Btn variant="outline" small full onClick={() => call('dispute', { note })} disabled={loading !== null}>
                    {loading === 'dispute' ? 'Submitting…' : 'Submit dispute'}
                  </Btn>
                  <Btn variant="ghost" small onClick={() => setShowDispute(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDispute(true)} className="font-sans text-xs text-on-surface-variant hover:text-[#c0392b] transition-colors text-left">
                Raise a dispute
              </button>
            )
          )}

          {canCancel && (
            showCancel ? (
              <div className="flex gap-2">
                <Btn variant="outline" small full onClick={() => call('cancel')} disabled={loading !== null}>
                  {loading === 'cancel' ? 'Cancelling…' : 'Confirm cancellation'}
                </Btn>
                <Btn variant="ghost" small onClick={() => setShowCancel(false)}>Back</Btn>
              </div>
            ) : (
              <button onClick={() => setShowCancel(true)} className="font-sans text-xs text-on-surface-variant hover:text-[#c0392b] transition-colors text-left">
                Cancel this booking
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
