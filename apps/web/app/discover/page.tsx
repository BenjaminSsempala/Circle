import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { DiscoverClient } from './_components/DiscoverClient';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import type { DiscoverArtist } from '@/app/components/discover/ArtistCard';

// Anon client for public ranking query (no RLS needed for public data)
const anonSupabase = createAnonClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function getRankedArtists(availableOn?: string): Promise<DiscoverArtist[]> {
  // Fetch artists + their active packages in parallel
  const [{ data: artists }, { data: packages }] = await Promise.all([
    anonSupabase.from('artists').select('*').limit(100),
    anonSupabase.from('packages').select('artist_id, price, currency').eq('is_active', true),
  ]);

  if (!artists) return [];

  // Build min price map per artist
  const priceMap = new Map<string, { min: number; currency: string }>();
  for (const pkg of packages ?? []) {
    const existing = priceMap.get(pkg.artist_id);
    if (!existing || pkg.price < existing.min) {
      priceMap.set(pkg.artist_id, { min: pkg.price, currency: pkg.currency ?? 'UGX' });
    }
  }

  // availableOn filter: exclude artists who are blacked out or already booked on that date
  let unavailable = new Set<string>();
  if (availableOn) {
    const [{ data: blackouts }, { data: bookedArtists }] = await Promise.all([
      anonSupabase.from('availability').select('artist_id').eq('date', availableOn).eq('type', 'blackout'),
      anonSupabase.from('bookings').select('artist_id').eq('gig_date', availableOn).not('state', 'in', '("DECLINED","CANCELLED","REFUNDED")'),
    ]);

    unavailable = new Set([
      ...(blackouts ?? []).map((r: { artist_id: string }) => r.artist_id),
      ...(bookedArtists ?? []).map((r: { artist_id: string }) => r.artist_id),
    ]);
  }

  // Compute ranking score in JS
  const scored = artists
    .filter((a) => !unavailable.has(a.id))
    .map((a) => {
      const hasPackages = priceMap.has(a.id);
      const score =
        (a.profile_photo ? 20 : 0) +
        (a.bio && a.bio.length > 50 ? 15 : 0) +
        (hasPackages ? 25 : 0) +
        ((a.completed_bookings ?? 0) * 2);

      const priceInfo = priceMap.get(a.id);
      return {
        id: a.id,
        slug: a.slug,
        name: a.display_name ?? a.name,
        bio: a.bio,
        profile_photo: a.profile_photo,
        feature_media: a.feature_media ?? null,
        art_forms: a.art_forms ?? [],
        tags: a.tags ?? [],
        booking_contexts: a.booking_contexts ?? [],
        city: a.city,
        country: a.country,
        completed_bookings: a.completed_bookings ?? 0,
        min_price: priceInfo?.min,
        currency: priceInfo?.currency,
        selected_works: Array.isArray(a.selected_works) ? a.selected_works : [],
        _score: score,
      };
    });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, 50)
    .map(({ _score, ...artist }) => artist);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const availableOn = typeof sp.availableOn === 'string' ? sp.availableOn : undefined;
  const inviteToGigId = typeof sp.inviteToGig === 'string' ? sp.inviteToGig : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isGuest = !user;
  let isArtist = false;
  let savedIds: string[] = [];
  let showOccasionBanner = false;

  if (user) {
    // Fetch profile + saved artists in parallel
    const [{ data: profile }, { data: saved }] = await Promise.all([
      supabase.from('profiles').select('role, occasion_type').eq('id', user.id).maybeSingle(),
      supabase.from('saved_artists').select('artist_id').eq('audience_id', user.id),
    ]);

    isArtist = profile?.role === 'artist';
    savedIds = isArtist ? [] : (saved ?? []).map((r) => r.artist_id);
    showOccasionBanner = profile?.role === 'audience' && !profile?.occasion_type;
  }

  const artists = await getRankedArtists(availableOn);

  // Fetch invite-to-gig gig post if mode is active
  let inviteToGig: { id: string; title: string } | undefined;
  if (inviteToGigId && user) {
    const { data: gig } = await createServiceClient()
      .from('gig_posts')
      .select('id, title, audience_id')
      .eq('id', inviteToGigId)
      .maybeSingle();

    if (gig && gig.audience_id === user.id) {
      inviteToGig = { id: gig.id, title: gig.title };
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="bg-surface border-b border-outline-variant/30 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-headline-md font-headline-md font-bold text-primary shrink-0">
            Circle
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/discover" className="text-on-surface font-semibold text-sm border-b-2 border-primary pb-0.5">Explore</Link>
            {!isGuest && (
              <>
                <Link href="/my-circle" className="text-on-surface-variant text-sm hover:text-primary transition-colors">My Circle</Link>
                <Link href="/saved" className="text-on-surface-variant text-sm hover:text-primary transition-colors">Saved</Link>
                <Link href="/bookings" className="text-on-surface-variant text-sm hover:text-primary transition-colors">My bookings</Link>
                {!isArtist && <Link href="/my-circle/gigs" className="text-on-surface-variant text-sm hover:text-primary transition-colors">My Gig Posts</Link>}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isGuest ? (
              <>
                <Link href="/auth/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary text-on-primary text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Join free
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/saved" className="md:hidden text-on-surface-variant hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                <AccountMenu />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-[1440px] mx-auto px-4 md:px-10 py-8 w-full">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">
              {inviteToGig ? 'Invite artists' : isGuest ? 'Discover artists' : 'Explore artists'}
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mt-1">
              East Africa&apos;s finest creative talent, ready to book.
            </p>
          </div>
          {/* Audience gig post prompt */}
          {!isGuest && !isArtist && !inviteToGig && (
            <Link
              href="/my-circle/gigs?new=1"
              className="flex-shrink-0 flex items-center gap-2 border border-primary text-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post what you&apos;re looking for
            </Link>
          )}
        </div>

        <DiscoverClient
          artists={artists}
          isGuest={isGuest}
          isArtist={isArtist}
          initialSavedIds={savedIds}
          showOccasionBanner={showOccasionBanner}
          inviteToGig={inviteToGig}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-4 md:px-10">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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
