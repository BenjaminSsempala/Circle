import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { CopyLinkButton } from './_components/CopyLinkButton';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(n: number, currency = 'UGX') {
  return `${currency} ${Number(n).toLocaleString()}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;

  const { data: packages } = artist
    ? await supabase.from('packages').select('id').eq('artist_id', artist.id).eq('is_active', true)
    : { data: [] };

  // Bookings – table may not exist yet, so catch the error gracefully
  let upcomingBookings: Record<string, unknown>[] = [];
  let pendingRequests: Record<string, unknown>[] = [];
  let earningsMonth = 0;
  let earningsAllTime = 0;
  let completedCount = 0;

  if (artist) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Run all 4 booking queries in parallel — was sequential, saving ~60-100ms per dashboard load
    const [
      { data: upcoming },
      { data: requests },
      { data: monthTxns },
      { data: allTxns },
    ] = await Promise.all([
      (await createClient())
        .from('bookings')
        .select('*, packages(name)')
        .eq('artist_id', artist.id)
        .in('state', ['ACCEPTED', 'CONTRACT_DRAFT', 'CONTRACT_SENT', 'AUDIENCE_UPLOADED', 'CONTRACT_SIGNED', 'PAYMENT_HELD', 'GIG_ACTIVE', 'CHECKED_IN', 'CONFIRMING'])
        .order('gig_date', { ascending: true })
        .limit(5),
      (await createClient())
        .from('bookings')
        .select('*, packages(name)')
        .eq('artist_id', artist.id)
        .eq('state', 'REQUESTED'),
      (await createClient())
        .from('bookings')
        .select('price')
        .eq('artist_id', artist.id)
        .in('state', ['COMPLETED', 'AUTO_RELEASED'])
        .gte('updated_at', monthStart),
      (await createClient())
        .from('bookings')
        .select('price')
        .eq('artist_id', artist.id)
        .in('state', ['COMPLETED', 'AUTO_RELEASED']),
    ]);

    upcomingBookings = upcoming ?? [];
    pendingRequests = requests ?? [];
    earningsMonth = (monthTxns ?? []).reduce((s, b) => s + Number(b.price ?? 0), 0);
    earningsAllTime = (allTxns ?? []).reduce((s, b) => s + Number(b.price ?? 0), 0);
    completedCount = (allTxns ?? []).length;
  }

  // Profile completeness
  const checks = {
    photo: !!artist?.profile_photo,
    bio: !!artist?.bio,
    packages: (packages?.length ?? 0) > 0,
  };
  const score = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((score / 3) * 100);

  const firstName = (artist?.display_name ?? artist?.name ?? '').split(' ')[0] || 'there';

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">
          {greeting()}, {firstName}.
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: pending actions + upcoming */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Pending actions */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider mb-3">
                Pending actions
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {pendingRequests.map((b) => (
                  <div
                    key={String(b.id)}
                    className="min-w-[220px] bg-surface border-l-4 border-secondary-container rounded-lg p-4 shadow-sm"
                  >
                    <p className="text-label-mono font-label-mono text-on-surface font-semibold text-sm mb-1">
                      New booking from {String(b.audience_name ?? 'Client')}
                    </p>
                    <p className="text-caption font-caption text-on-surface-variant mb-3">
                      {(b.packages as { name?: string } | null)?.name ?? 'Performance inquiry'}
                    </p>
                    <Link
                      href={`/dashboard/bookings?tab=requests`}
                      className="inline-block bg-secondary-container text-on-secondary-container text-xs font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
                    >
                      Review Request
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming bookings */}
          <section>
            <h2 className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider mb-3">
              Upcoming
            </h2>
            {upcomingBookings.length === 0 ? (
              <div className="bg-surface border border-outline-variant/30 rounded-xl p-8 text-center">
                <p className="text-on-surface-variant text-body-md font-body-md">No upcoming bookings yet.</p>
                <p className="text-caption font-caption text-on-surface-variant mt-1">
                  Share your profile to start getting booked.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingBookings.map((b) => {
                  const gigDate = (b.gig_date ?? b.delivery_date) as string | null;
                  const date = gigDate ? new Date(`${gigDate}T00:00:00Z`) : null;
                  return (
                    <div
                      key={String(b.id)}
                      className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex items-center gap-4"
                    >
                      {date && (
                        <div className="w-16 shrink-0 bg-primary rounded-lg text-center py-2">
                          <p className="text-[10px] text-on-primary/70 uppercase tracking-wider">
                            {date.toLocaleString('default', { month: 'short' })}
                          </p>
                          <p className="text-xl font-bold text-on-primary leading-none">{date.getUTCDate()}</p>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-label-mono font-label-mono text-on-surface truncate">
                          {(b.packages as { name?: string } | null)?.name ?? 'Booking'}
                        </p>
                        <p className="text-caption font-caption text-on-surface-variant">
                          Client: {String(b.audience_name ?? '-')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {b.price && (
                          <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                            {formatPrice(Number(b.price), String(b.currency ?? 'UGX'))}
                          </span>
                        )}
                        <Link
                          href={`/dashboard/bookings`}
                          className="text-primary text-sm font-semibold hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: earnings + profile completeness + quick links */}
        <div className="flex flex-col gap-4">

          {/* Profile completeness */}
          {pct < 100 && (
            <div className="bg-surface border border-outline-variant/30 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-label-mono font-label-mono text-on-surface uppercase tracking-wider text-xs">
                  Profile completeness
                </p>
                <span className="text-label-mono font-label-mono text-primary text-xs font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <Link
                href="/dashboard/profile"
                className="text-primary text-xs font-semibold hover:underline"
              >
                Finish setup
              </Link>
              <div className="mt-3 flex flex-col gap-1.5">
                {[
                  { label: 'Profile photo', done: checks.photo },
                  { label: 'Bio', done: checks.bio },
                  { label: 'At least one package', done: checks.packages },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-caption font-caption">
                    <span className={c.done ? 'text-primary' : 'text-on-surface-variant'}>
                      {c.done ? '✓' : '○'}
                    </span>
                    <span className={c.done ? 'text-on-surface line-through opacity-50' : 'text-on-surface-variant'}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earnings */}
          <div className="bg-surface border border-outline-variant/30 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">
                Earnings Summary
              </p>
              <svg className="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-caption font-caption text-on-surface-variant">This month</span>
                <span className="text-label-mono font-label-mono text-on-surface font-bold">
                  {formatPrice(earningsMonth)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-outline-variant/20 pt-3">
                <span className="text-caption font-caption text-on-surface-variant">All time</span>
                <span className="text-label-mono font-label-mono text-on-surface font-bold">
                  {formatPrice(earningsAllTime)}
                </span>
              </div>
              {completedCount > 0 && (
                <p className="text-caption font-caption text-on-surface-variant">
                  {completedCount} completed gig{completedCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-surface border border-outline-variant/30 rounded-xl p-5">
            <p className="text-label-mono font-label-mono text-on-surface-variant uppercase tracking-wider text-xs mb-4">
              Quick links
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Edit profile', href: '/dashboard/profile', icon: '✏️' },
                { label: 'Packages', href: '/dashboard/packages', icon: '📦' },
                { label: 'Availability', href: '/dashboard/availability', icon: '📅' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex flex-col items-center gap-2 bg-surface-container rounded-xl p-3 hover:bg-surface-container-high transition-colors text-center"
                >
                  <span className="text-xl">{l.icon}</span>
                  <span className="text-caption font-caption text-on-surface text-xs">{l.label}</span>
                </Link>
              ))}
              {artist && (
                <CopyLinkButton slug={artist.slug} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
