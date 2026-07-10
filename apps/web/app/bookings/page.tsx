import { redirect } from 'next/navigation';
import Link from 'next/link'; // Note: Ensure this resolves to 'next/link'
import { createClient } from '@/lib/supabase/server';
import { listBookings, type Booking } from '@/lib/services/bookings';
import { StatusBadge } from '@/app/components/booking/ui';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import NavbarClient from '../components/booking/NavBarClient'; 

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
    artists: { id: string; user_id: string; display_name: string; slug: string; profile_photo: string | null };
    packages: { id: string; name: string } | null;
  })[] : [];

  const filtered = bookings.filter((b) => {
    if (activeTab === 'past') return PAST_STATES.has(b.state);
    if (activeTab === 'cancelled') return CANCELLED_STATES.has(b.state);
    return !PAST_STATES.has(b.state) && !CANCELLED_STATES.has(b.state);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Responsive Navigation Bar */}
      <NavbarClient accountMenu={<AccountMenu />} />

      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 w-full">
        <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface mb-2">Booking Management</h1>
        <p className="text-body-sm sm:text-body-md font-body-md text-on-surface-variant mb-6 md:mb-8">
          Manage your upcoming performances, track past engagements.
        </p>

        {/* Tabs - Horizontal Scrollable Wrapper on Mobile */}
        <div className="overflow-x-auto no-scrollbar border-b border-outline-variant/30 mb-6 md:mb-8">
          <div className="flex gap-6 min-w-max">
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
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-on-surface-variant/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-on-surface text-body-md sm:text-body-lg font-body-lg font-semibold mb-2">
              No {activeTab} bookings
            </p>
            <p className="text-on-surface-variant text-sm sm:text-body-md font-body-md mb-6 max-w-sm">
              When you book an artist, your booking will appear here.
            </p>
            <Link
              href="/discover"
              className="bg-primary text-on-primary text-sm sm:text-base font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:opacity-90 transition-opacity"
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
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {b.artists.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.artists.profile_photo} alt={b.artists.display_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-on-surface truncate text-sm sm:text-base">{b.packages?.name ?? 'Booking'}</div>
                    <div className="text-xs sm:text-sm text-on-surface-variant truncate">
                      with {b.artists.display_name}
                      {b.gig_date && ` · ${fmtDate(b.gig_date)}`}
                      {b.delivery_date && ` · Delivery ${fmtDate(b.delivery_date)}`}
                    </div>
                  </div>
                </div>
                <div className="self-end sm:self-center flex-shrink-0">
                  <StatusBadge state={b.state} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-outline-variant/20 py-6 md:py-8 px-4 sm:px-6 md:px-10">
        <div className="max-w-[1440px] mx-auto flex flex-col-reverse sm:flex-row gap-4 justify-between items-center text-center sm:text-left">
          <p className="text-xs md:text-caption font-caption text-on-surface-variant">© 2026 Engero · Connecting African Artistry.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {['Privacy', 'Terms', 'Support', 'Contact'].map((item) => (
              <a key={item} href="#" className="text-xs md:text-caption font-caption text-on-surface-variant hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}