import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default async function AudienceBookingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const activeTab = searchParams.tab ?? 'upcoming';

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

        {/* Empty state (stub — bookings coming in Block 3) */}
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
