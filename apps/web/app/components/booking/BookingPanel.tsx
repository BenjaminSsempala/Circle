'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Field, Rule, Btn, Input, Textarea, Lbl } from './ui';

type ProductType = 'service' | 'digital' | 'merchandise';

type CancellationTerms = {
  within_48_hours_refund_pct: number;
  within_7_days_refund_pct: number;
  more_than_7_days_refund_pct: number;
};

export type BookingPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: string | null;
  product_type?: ProductType;
  cancellation_terms?: CancellationTerms | null;
};

export type BookingArtist = {
  slug: string;
  name: string;
  profile_photo: string | null;
  social_links: Record<string, string>;
  account_email: string | null;
};

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

function whatsappLink(social: Record<string, string>) {
  const raw = social.whatsapp ?? social.phone;
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function BookingPanel({
  pkg,
  artist,
  isLoggedIn,
  onClose,
}: {
  pkg: BookingPackage;
  artist: BookingArtist;
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const productType = pkg.product_type ?? 'service';

  const [gigDate, setGigDate] = useState('');
  const [gigTime, setGigTime] = useState('');
  const [venue, setVenue] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [policyOpen, setPolicyOpen] = useState(false);

  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ id: string; reference_number?: string } | null>(null);

  useEffect(() => {
    if (productType !== 'service') return;
    fetch(`/api/artists/${artist.slug}/availability`)
      .then((r) => r.json())
      .then((data) => {
        setBlackoutDates(data?.data?.blackoutDates ?? []);
        setBookedDates(data?.data?.bookedDates ?? []);
      })
      .catch(() => {});
  }, [artist.slug, productType]);

  const unavailable = new Set([...blackoutDates, ...bookedDates]);

  async function handleSubmit() {
    setError(null);

    if (productType === 'service' && !gigDate) {
      setError('Please choose a date for this booking.');
      return;
    }
    if (productType === 'service' && unavailable.has(gigDate)) {
      setError('That date is unavailable. Please choose another date.');
      return;
    }
    if (productType === 'digital' && !deliveryDate) {
      setError('Please choose a delivery date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          productType,
          gigDate: productType === 'service' ? gigDate : undefined,
          gigTime: productType === 'service' ? gigTime : undefined,
          venue: productType === 'service' ? venue : undefined,
          deliveryDate: productType === 'digital' ? deliveryDate : undefined,
          specialRequirements: specialRequirements || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setBooking(json.booking);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const wa = whatsappLink(artist.social_links);
  const email = artist.social_links.email || artist.account_email;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full md:w-[420px] max-h-[88vh] md:max-h-none md:h-full bg-[#fcf9f8] rounded-t-2xl md:rounded-none shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 flex-shrink-0">
          <div>
            <Lbl className="mb-0.5">Booking request</Lbl>
            <div className="font-sans font-bold text-on-surface">{pkg.name}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-primary/5 text-on-surface-variant">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="font-sans text-sm text-on-surface-variant max-w-xs">
                Please sign in or create an account to send a booking request to {artist.name}.
              </div>
              <Link href={`/auth/login?redirect=/${artist.slug}`}>
                <Btn variant="teal">Sign in to continue</Btn>
              </Link>
            </div>
          ) : booking ? (
            // ── A3 confirmation state ─────────────────────────────────
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3 pt-2">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,84,64,0.07)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M4.5 12.75l6 6 9-13.5" stroke="#005440" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="font-sans font-bold text-lg text-on-surface">Request sent to {artist.name}</div>
                <div className="font-sans text-sm text-on-surface-variant max-w-xs">
                  They&apos;ll review your request and respond soon. You&apos;ll get an email update at each step.
                </div>
                {booking.reference_number && (
                  <div className="font-mono text-xs text-primary tracking-wider mt-1">
                    REF {booking.reference_number}
                  </div>
                )}
              </div>

              <Rule />

              <div>
                <Lbl>Artist contact</Lbl>
                <div className="rounded-xl border border-primary/10 bg-white p-4 flex items-center gap-3">
                  {artist.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.profile_photo} alt={artist.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-sans font-bold text-sm text-on-surface">{artist.name}</div>
                    <div className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Artist</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="flex-1">
                      <Btn variant="green" full small>WhatsApp</Btn>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="flex-1">
                      <Btn variant="tealOutline" full small>Email</Btn>
                    </a>
                  )}
                </div>
              </div>

              <Link href={`/booking/${booking.id}`}>
                <Btn variant="teal" full>View booking status</Btn>
              </Link>
            </div>
          ) : (
            // ── Booking form ──────────────────────────────────────────
            <div className="flex flex-col gap-1">
              <div className="rounded-xl border border-primary/10 bg-white p-4 mb-4">
                <div className="font-sans font-bold text-on-surface">{pkg.name}</div>
                {pkg.description && <div className="font-sans text-sm text-on-surface-variant mt-1">{pkg.description}</div>}
                <div className="font-sans font-bold text-primary mt-2">
                  {formatPrice(pkg.price, pkg.currency)}
                  {pkg.duration && <span className="font-normal text-on-surface-variant text-sm"> / {pkg.duration.toLowerCase()}</span>}
                </div>
              </div>

              {productType === 'service' && (
                <>
                  <Field label="Date">
                    <Input type="date" value={gigDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setGigDate(e.target.value)} />
                    {unavailable.size > 0 && (
                      <div className="font-sans text-[11px] text-on-surface-variant mt-1">Some dates are unavailable — you&apos;ll be notified if your chosen date doesn&apos;t work.</div>
                    )}
                  </Field>
                  <Field label="Time">
                    <Input type="time" value={gigTime} onChange={(e) => setGigTime(e.target.value)} />
                  </Field>
                  <Field label="Venue / location">
                    <Input type="text" placeholder="e.g. Kampala Serena Hotel" value={venue} onChange={(e) => setVenue(e.target.value)} />
                  </Field>
                  <Field label="Special requirements (optional)">
                    <Textarea rows={3} placeholder="Anything the artist should know — stage setup, run order, etc." value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
                  </Field>

                  {pkg.cancellation_terms && (
                    <div className="mt-2 mb-2">
                      <button onClick={() => setPolicyOpen((v) => !v)} className="flex items-center justify-between w-full font-mono text-[10px] uppercase tracking-[0.2em] text-primary py-2">
                        Cancellation policy
                        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 transition-transform ${policyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {policyOpen && (
                        <div className="font-sans text-xs text-on-surface-variant rounded-lg bg-white border border-primary/10 p-3 flex flex-col gap-1.5">
                          <div>More than 7 days before: {pkg.cancellation_terms.more_than_7_days_refund_pct}% refund</div>
                          <div>Within 7 days: {pkg.cancellation_terms.within_7_days_refund_pct}% refund</div>
                          <div>Within 48 hours: {pkg.cancellation_terms.within_48_hours_refund_pct}% refund</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {productType === 'digital' && (
                <>
                  <Field label="Preferred delivery date">
                    <Input type="date" value={deliveryDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDeliveryDate(e.target.value)} />
                  </Field>
                  <Field label="Brief / requirements">
                    <Textarea rows={6} placeholder="Describe what you'd like delivered — references, dimensions, format, deadline notes…" value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
                  </Field>
                </>
              )}

              {productType === 'merchandise' && (
                <Field label="Notes for the artist (optional)">
                  <Textarea rows={5} placeholder="Sizing, customisation, delivery preferences, etc." value={specialRequirements} onChange={(e) => setSpecialRequirements(e.target.value)} />
                </Field>
              )}

              {error && (
                <div className="font-sans text-sm text-[#c0392b] bg-[#c0392b]/5 border border-[#c0392b]/20 rounded-lg px-3 py-2 mt-2">{error}</div>
              )}

              <div className="mt-4">
                <Btn variant="amber" full onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send booking request'}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
