import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listBookings, type Booking } from '@/lib/services/bookings';
import { StatusBadge } from '@/app/components/booking/ui';
import { AccountMenu } from '@/app/components/nav/AccountMenu';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const PAST_STATES = new Set(['COMPLETED', 'AUTO_RELEASED']);
const CANCELLED_STATES = new Set(['CANCELLED', 'DECLINED', 'REFUNDED', 'DISPUTED']);

function fmtDate(date: string | null) {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default async function AudienceBookingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const activeTab = searchParams.tab ?? 'upcoming';

  const result = await listBookings(user.id, 'audience');
  const bookings = result.ok ? result.bookings as (Booking & {
    artists: { id: string; user_id: string; name: string; slug: string; profile_photo: string | null };
    packages: { id: string; name: string } | null;
  })[] : [];

  const filtered = bookings.filter((b) => {
    if (activeTab === 'past') return PAST_STATES.has(b.state);
    if (activeTab === 'cancelled') return CANCELLED_STATES.has(b.state);
    return !PAST_STATES.has(b.state) && !CANCELLED_STATES.has(b.state);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-headline-md font-headline-md font-bold text-primary">Circle</Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/discover" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Explore</Link>
            <Link href="/saved" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Saved</Link>
            <Link href="/bookings" className="text-on-surface font-semibold text-sm border-b-2 border-primary pb-0.5">My bookings</Link>
          </div>
          <AccountMenu />
        </div>
      </nav>

      <main className="flex-1 max-w-[1440px] mx-auto px-4 md:px-10 py-8 w-full">
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Booking Management</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mb-8">
          Manage your upcoming performances, track past engagements.
        </p>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-outline-variant/30 mb-8">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/bookings?tab=${t.key}`}
              className={`pb-3 text-label-mono font-label-mono text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === t.key
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-on-surface'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-on-surface-variant/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-on-surface text-body-lg font-body-lg font-semibold mb-2">
              No {activeTab} bookings
            </p>
            <p className="text-on-surface-variant text-body-md font-body-md mb-6 max-w-sm">
              When you book an artist, your booking will appear here.
            </p>
            <Link
              href="/discover"
              className="bg-primary text-on-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Find an artist
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((b) => (
              <Link
                key={b.id}
                href={`/booking/${b.id}`}
                className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 hover:border-primary/30 transition-colors"
              >
                {b.artists.profile_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.artists.profile_photo} alt={b.artists.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-on-surface truncate">{b.packages?.name ?? 'Booking'}</div>
                  <div className="text-sm text-on-surface-variant truncate">
                    with {b.artists.name}
                    {b.gig_date && ` · ${fmtDate(b.gig_date)}`}
                    {b.delivery_date && ` · Delivery ${fmtDate(b.delivery_date)}`}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge state={b.state} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant/20 py-8 px-4 md:px-10">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <p className="text-caption font-caption text-on-surface-variant">© 2026 Circle · Connecting African Artistry.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support', 'Contact'].map((item) => (
              <a key={item} href="#" className="text-caption font-caption text-on-surface-variant hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
