'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'requests', label: 'Requests' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

type Booking = Record<string, unknown>;

function stateLabel(state: string) {
  const map: Record<string, string> = {
    REQUESTED: 'Pending',
    ACCEPTED: 'Accepted',
    CONTRACT_DRAFT: 'Preparing contract',
    CONTRACT_SENT: 'Contract sent',
    AUDIENCE_UPLOADED: 'Awaiting countersignature',
    CONTRACT_SIGNED: 'Confirmed',
    PAYMENT_HELD: 'In Escrow',
    GIG_ACTIVE: 'Active',
    CHECKED_IN: 'Checked In',
    CONFIRMING: 'Confirming',
    COMPLETED: 'Completed',
    AUTO_RELEASED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    DECLINED: 'Declined',
  };
  return map[state] ?? state;
}

function stateColor(state: string) {
  if (['COMPLETED', 'AUTO_RELEASED', 'CONTRACT_SIGNED', 'PAYMENT_HELD'].includes(state))
    return 'bg-primary/10 text-primary';
  if (state === 'REQUESTED') return 'bg-secondary-container/40 text-secondary';
  if (['CANCELLED', 'REFUNDED', 'DECLINED'].includes(state))
    return 'bg-error/10 text-error';
  return 'bg-surface-container text-on-surface-variant';
}

function actionForState(state: string): { label: string; endpoint: string } | null {
  const map: Record<string, { label: string; endpoint: string }> = {
    REQUESTED: { label: 'Review & Accept', endpoint: 'accept' },
    CONFIRMING: { label: 'Confirm Gig', endpoint: 'confirm' },
  };
  return map[state] ?? null;
}

function formatDate(d: string | unknown) {
  if (!d) return '-';
  const date = new Date(String(d));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPrice(amount: unknown, currency: unknown) {
  if (!amount) return '-';
  return `${currency ?? 'UGX'} ${Number(amount).toLocaleString()}`;
}

function packageName(b: Booking) {
  return (b.packages as { name?: string } | null)?.name ?? 'Booking';
}

function eventDate(b: Booking) {
  return (b.gig_date ?? b.delivery_date) as string | null;
}

function BookingDetailPanel({
  booking,
  onClose,
  onUpdated,
}: {
  booking: Booking;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const action = actionForState(String(booking.state ?? ''));
  const canDecline = booking.state === 'REQUESTED';
  const hasContractLink = ['CONTRACT_DRAFT', 'CONTRACT_SENT', 'AUDIENCE_UPLOADED', 'CONTRACT_SIGNED', 'CONFIRMING', 'COMPLETED', 'AUTO_RELEASED'].includes(String(booking.state ?? ''));

  async function handleAction(endpoint: string) {
    setLoading(endpoint);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/${endpoint}`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? 'Something went wrong.');
        return;
      }
      onUpdated();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <h2 className="text-headline-md font-headline-md text-on-surface">Booking Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div>
            <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider mb-1">Package</p>
            <p className="text-label-mono font-label-mono text-on-surface font-semibold">
              {packageName(booking)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Status</p>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${stateColor(String(booking.state ?? ''))}`}>
                {stateLabel(String(booking.state ?? ''))}
              </span>
            </div>
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Amount</p>
              <p className="text-label-mono font-label-mono text-on-surface">
                {formatPrice(booking.price, booking.currency)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-caption font-caption text-on-surface-variant mb-1">Date</p>
            <p className="text-body-md font-body-md text-on-surface">
              {formatDate(eventDate(booking))}{booking.gig_time ? ` · ${String(booking.gig_time)}` : ''}
            </p>
          </div>
          {booking.venue && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Venue</p>
              <p className="text-body-md font-body-md text-on-surface">{String(booking.venue)}</p>
            </div>
          )}
          {(booking.packages as { duration?: string } | null)?.duration && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Duration</p>
              <p className="text-body-md font-body-md text-on-surface">{String((booking.packages as { duration?: string }).duration)}</p>
            </div>
          )}
          <div>
            <p className="text-caption font-caption text-on-surface-variant mb-1">Client</p>
            <p className="text-body-md font-body-md text-on-surface">
              {String(booking.audience_name || booking.audience_email || 'Guest')}
            </p>
            {booking.audience_email && booking.audience_name !== booking.audience_email && (
              <p className="text-caption font-caption text-primary text-xs mt-0.5">{String(booking.audience_email)}</p>
            )}
          </div>
          {(booking.special_requirements || booking.audience_notes) && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">
                {booking.product_type === 'digital' ? 'Brief' : 'Special requirements'}
              </p>
              <p className="text-body-md font-body-md text-on-surface whitespace-pre-wrap">{String(booking.special_requirements || booking.audience_notes)}</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-outline-variant/30 flex flex-col gap-2">
            {error && (
              <div className="text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2">{error}</div>
            )}
            <Link
              href={`/booking/${booking.id}`}
              className="w-full text-center bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              {hasContractLink ? 'View booking & contract' : 'View booking'}
            </Link>
            {action && (
              <button
                onClick={() => handleAction(action.endpoint)}
                disabled={loading !== null}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading === action.endpoint ? 'Processing…' : action.label}
              </button>
            )}
            {canDecline && (
              <button
                onClick={() => handleAction('decline')}
                disabled={loading !== null}
                className="w-full border border-outline-variant text-on-surface-variant font-semibold py-3 rounded-xl hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                {loading === 'decline' ? 'Declining…' : 'Decline'}
              </button>
            )}
          </div>
      </div>
    </>
  );
}

export function BookingsClient({
  bookings,
  activeTab,
}: {
  bookings: Booking[];
  activeTab: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Booking | null>(null);

  function setTab(tab: string) {
    router.push(`/dashboard/bookings?tab=${tab}`);
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-label-mono font-label-mono text-sm whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {bookings.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-12 text-center">
          <p className="text-on-surface-variant text-body-md font-body-md">No bookings here yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div
              key={String(b.id)}
              className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
              onClick={() => setSelected(b)}
            >
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-lg bg-surface-container-high shrink-0 flex items-center justify-center">
                <span className="text-on-surface-variant text-lg">🎭</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-label-mono font-label-mono text-on-surface font-semibold truncate">
                  {String(b.audience_name || b.audience_email || 'Guest')}
                </p>
                <p className="text-caption font-caption text-on-surface-variant truncate">
                  {packageName(b)}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">Date</p>
                  <p className="text-label-mono font-label-mono text-on-surface text-sm">{formatDate(eventDate(b))}</p>
                </div>
                <div className="text-right">
                  <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">Amount</p>
                  <p className="text-label-mono font-label-mono text-on-surface font-bold text-sm">
                    {formatPrice(b.price, b.currency)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stateColor(String(b.state ?? ''))}`}>
                  {stateLabel(String(b.state ?? ''))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
