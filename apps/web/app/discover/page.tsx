import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { DiscoverClient } from './_components/DiscoverClient';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import type { DiscoverArtist } from '@/app/components/discover/ArtistCard';
import { calculateRankingScore } from '@/lib/utils/ranking';
import NavbarDiscoverClient from './_components/NavbarDiscoverClient';

async function getRankedArtists(availableOn?: string): Promise<DiscoverArtist[]> {
  const anonSupabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [{ data: artists }, { data: packages }] = await Promise.all([
    anonSupabase.from('artists').select('*').limit(100),
    anonSupabase.from('packages').select('artist_id, price, currency').eq('is_active', true),
  ]);

  if (!artists) return [];

  const priceMap = new Map<string, { min: number; currency: string }>();
  for (const pkg of packages ?? []) {
    const existing = priceMap.get(pkg.artist_id);
    if (!existing || pkg.price < existing.min) {
      priceMap.set(pkg.artist_id, { min: pkg.price, currency: pkg.currency ?? 'UGX' });
    }
  }

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

  const scored = artists
    .filter((a) => !unavailable.has(a.id))
    .map((a) => {
      const hasPackages = priceMap.has(a.id);
      const score = calculateRankingScore(a, hasPackages);
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
    const [{ data: profile }, { data: saved }] = await Promise.all([
      supabase.from('profiles').select('role, occasion_type').eq('id', user.id).maybeSingle(),
      supabase.from('saved_artists').select('artist_id').eq('audience_id', user.id),
    ]);

    isArtist = profile?.role === 'artist';
    savedIds = isArtist ? [] : (saved ?? []).map((r) => r.artist_id);
    showOccasionBanner = profile?.role === 'audience' && !profile?.occasion_type;
  }

  const artists = await getRankedArtists(availableOn);

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
      {/* Client component rendering mobile responsive shell */}
      <NavbarDiscoverClient 
        isGuest={isGuest} 
        isArtist={isArtist} 
        accountMenu={<AccountMenu />} 
      />

      {/* Main Body */}
      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">
              {inviteToGig ? 'Invite artists' : isGuest ? 'Discover artists' : 'Explore artists'}
            </h1>
            <p className="text-body-sm sm:text-body-md font-body-md text-on-surface-variant mt-1">
              East Africa&apos;s finest creative talent, ready to book.
            </p>
          </div>
          
          {/* Action Prompt Element */}
          {!isGuest && !isArtist && !inviteToGig && (
            <Link
              href="/my-circle/gigs?new=1"
              className="sm:self-start flex items-center justify-center gap-2 border border-primary text-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-colors w-full sm:w-auto text-center"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Footnote Elements Footer */}
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