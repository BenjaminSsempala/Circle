'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  if (!d) return '—';
  const date = new Date(String(d));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(amount: unknown, currency: unknown) {
  if (!amount) return '—';
  return `${currency ?? 'UGX'} ${Number(amount).toLocaleString()}`;
}

function BookingDetailPanel({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const action = actionForState(String(booking.state ?? ''));

  async function handleAction() {
    if (!action) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/${action.endpoint}`, { method: 'POST' });
    } finally {
      setLoading(false);
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
            <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider mb-1">Event</p>
            <p className="text-label-mono font-label-mono text-on-surface font-semibold">
              {String(booking.event_name ?? 'Untitled')}
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
                {formatPrice(booking.amount, booking.currency)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-caption font-caption text-on-surface-variant mb-1">Date & Time</p>
            <p className="text-body-md font-body-md text-on-surface">{formatDate(booking.event_date)}</p>
          </div>
          {booking.duration && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Duration</p>
              <p className="text-body-md font-body-md text-on-surface">{String(booking.duration)}</p>
            </div>
          )}
          {booking.organiser_name && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Client</p>
              <p className="text-body-md font-body-md text-on-surface">{String(booking.organiser_name)}</p>
            </div>
          )}
          {booking.event_description && (
            <div>
              <p className="text-caption font-caption text-on-surface-variant mb-1">Description</p>
              <p className="text-body-md font-body-md text-on-surface">{String(booking.event_description)}</p>
            </div>
          )}
        </div>
        {action && (
          <div className="p-6 border-t border-outline-variant/30">
            <button
              onClick={handleAction}
              disabled={loading}
              className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Processing…' : action.label}
            </button>
          </div>
        )}
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
                  {String(b.organiser_name ?? 'Client')}
                </p>
                <p className="text-caption font-caption text-on-surface-variant truncate">
                  {String(b.event_name ?? 'Booking')}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">Date & Time</p>
                  <p className="text-label-mono font-label-mono text-on-surface text-sm">{formatDate(b.event_date)}</p>
                </div>
                {b.duration && (
                  <div className="text-right">
                    <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">Duration</p>
                    <p className="text-label-mono font-label-mono text-on-surface text-sm">{String(b.duration)}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-caption font-caption text-on-surface-variant uppercase tracking-wider">Amount</p>
                  <p className="text-label-mono font-label-mono text-on-surface font-bold text-sm">
                    {formatPrice(b.amount, b.currency)}
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
        />
      )}
    </>
  );
}
