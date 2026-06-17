import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getBooking } from '@/lib/services/bookings';
import { StatusBadge, TimelineStep, Rule, Lbl, Btn } from '@/app/components/booking/ui';
import { STATE_LABELS } from '@/app/components/booking/constants';
import { BookingActions } from '@/app/components/booking/BookingActions';
import { RatingForm } from '@/app/components/booking/RatingForm';

function fmtPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

function fmtDate(date: string | null) {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function whatsappLink(social: Record<string, string>) {
  const raw = social.whatsapp ?? social.phone;
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export default async function BookingStatusPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/booking/${params.id}`);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return notFound();

  const { booking, events, contract, role } = result;
  const artist = (booking as unknown as {
    artists: { id: string; user_id: string; name: string; slug: string; profile_photo: string | null; city: string | null; country: string | null; social_links: Record<string, string> | null };
  }).artists;
  const pkg = (booking as unknown as { packages: { id: string; name: string; description: string | null; duration: string | null } | null }).packages;

  const wa = whatsappLink((artist.social_links as Record<string, string>) ?? {});

  let email = (artist.social_links as Record<string, string> | null)?.email;
  if (!email) {
    const { data: { user: artistAuthUser } } = await createServiceClient().auth.admin.getUserById(artist.user_id);
    email = artistAuthUser?.email ?? undefined;
  }

  // Query existing review for this booking
  let existingReview: { stars: number; comment: string | null } | null = null;
  const isCompleted = booking.state === 'COMPLETED' || booking.state === 'AUTO_RELEASED';
  if (isCompleted && role === 'audience') {
    const { data: review } = await (await createClient())
      .from('reviews')
      .select('stars, comment')
      .eq('booking_id', booking.id)
      .eq('rater_id', user.id)
      .maybeSingle();
    existingReview = review;
  }

  return (
    <div className="bg-[#fcf9f8] min-h-screen text-[#1c1b1b] font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-10 w-full border-b border-primary/10">
        <div className="flex justify-between items-center w-full px-4 md:px-10 h-16 max-w-5xl mx-auto">
          <Link href="/" className="text-lg font-bold text-primary">Circle</Link>
          <Link href={role === 'artist' ? '/dashboard/bookings' : '/bookings'} className="text-xs font-mono uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
            My bookings
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-10 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main column */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Hero */}
          <div className="rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>Booking {contract?.reference_number ? `· REF ${contract.reference_number}` : ''}</Lbl>
            <h1 className="text-2xl font-bold text-on-surface mb-1">{pkg?.name ?? 'Booking'}</h1>
            <div className="text-sm text-on-surface-variant mb-4">
              {role === 'artist' ? `Request from ${booking.audience_name ?? 'a guest'}` : `with ${artist.name}`}
            </div>
            <StatusBadge state={booking.state} />
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>Next step</Lbl>
            <BookingActions
              bookingId={booking.id}
              state={booking.state}
              role={role}
              productType={booking.product_type}
              artistConfirmedAt={booking.artist_confirmed_at}
              audienceConfirmedAt={booking.audience_confirmed_at}
              hasContract={!!contract}
            />
          </div>

          {/* Rating */}
          {isCompleted && role === 'audience' && (
            <div className="rounded-xl border border-primary/10 bg-white p-6">
              <Lbl>Rate your experience</Lbl>
              <RatingForm
                bookingId={booking.id}
                artistName={artist.name}
                existingReview={existingReview}
              />
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>Timeline</Lbl>
            <div className="mt-2">
              {events.map((event, i) => (
                <TimelineStep
                  key={event.id || `${event.to_state}-${i}`}
                  label={STATE_LABELS[event.to_state]?.label ?? event.to_state}
                  time={fmtDateTime(event.created_at)}
                  done
                  active={i === events.length - 1}
                  last={i === events.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>Details</Lbl>
            <Rule />
            <dl className="flex flex-col gap-3">
              {pkg?.description && (
                <div>
                  <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">Package</dt>
                  <dd className="text-sm mt-0.5">{pkg.description}</dd>
                </div>
              )}

              {booking.product_type === 'service' && (
                <>
                  {booking.gig_date && (
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">Date</dt>
                      <dd className="text-sm mt-0.5">{fmtDate(booking.gig_date)}{booking.gig_time ? ` · ${booking.gig_time}` : ''}</dd>
                    </div>
                  )}
                  {booking.venue && (
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">Venue</dt>
                      <dd className="text-sm mt-0.5">{booking.venue}</dd>
                    </div>
                  )}
                </>
              )}

              {booking.product_type === 'digital' && booking.delivery_date && (
                <div>
                  <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">Delivery date</dt>
                  <dd className="text-sm mt-0.5">{fmtDate(booking.delivery_date)}</dd>
                </div>
              )}

              {booking.special_requirements && (
                <div>
                  <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                    {booking.product_type === 'digital' ? 'Brief' : 'Special requirements'}
                  </dt>
                  <dd className="text-sm mt-0.5 whitespace-pre-wrap">{booking.special_requirements}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs font-mono uppercase tracking-[0.2em] text-on-surface-variant">Price</dt>
                <dd className="text-sm mt-0.5 font-bold text-primary">{fmtPrice(booking.price, booking.currency)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4">
          <div className="sticky top-24 rounded-xl border border-primary/10 bg-white p-6">
            <Lbl>{role === 'artist' ? 'Audience' : 'Artist contact'}</Lbl>
            {role === 'artist' ? (
              <div className="flex flex-col gap-1">
                <div className="font-bold text-sm">{booking.audience_name ?? 'Guest'}</div>
                {booking.audience_email && <div className="text-sm text-on-surface-variant">{booking.audience_email}</div>}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {artist.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artist.profile_photo} alt={artist.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">{artist.name}</div>
                    {(artist.city || artist.country) && (
                      <div className="text-xs text-on-surface-variant">{[artist.city, artist.country].filter(Boolean).join(', ')}</div>
                    )}
                  </div>
                </div>
                {email && (
                  <div className="text-xs text-on-surface-variant mb-2 break-all">{email}</div>
                )}
                <div className="flex gap-2">
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
                <div className="mt-3">
                  <Link href={`/${artist.slug}`} className="text-xs font-mono uppercase tracking-[0.2em] text-primary hover:opacity-80">
                    View profile →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
