import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getArtistBySlug, getRedirectSlug } from '@/lib/services/artists';
import { getArtistEvents } from '@/lib/services/events';
import { OwnerBar } from './_components/OwnerBar';
import { EditableProfileHeader } from './_components/EditableProfileHeader';
import { EditableBio } from './_components/EditableBio';
import { PackagesSection } from './_components/PackagesSection';
import { SelectedWorksGrid } from './_components/SelectedWorksGrid';
import { EventsSection } from './_components/EventsSection';
import type { Work } from '@/lib/services/artists';
import { ProfileCircleNotes } from '@/app/components/profile/ProfileCircleNotes';
import { AccountMenu } from '@/app/components/nav/AccountMenu';

export default async function ArtistProfilePage({ params }: { params: { slug: string } }) {
  const [result, supabase] = await Promise.all([
    getArtistBySlug(params.slug),
    createClient(),
  ]);

  if (!result.ok) {
    const currentSlug = await getRedirectSlug(params.slug);
    if (currentSlug) permanentRedirect(`/${currentSlug}`);
    return notFound();
  }

  const { artist, packages } = result;
  const [{ data: { user } }, events] = await Promise.all([
    supabase.auth.getUser(),
    getArtistEvents(artist.id),
  ]);
  const isOwner = !!user && user.id === artist.user_id;

  const { data: reviewsData } = await (await createClient()).from('reviews').select('mood,comment,stars,rater_id').eq('ratee_id', artist.user_id).not('mood', 'is', null).not('comment', 'is', null).limit(6);
  const reviews = reviewsData ?? [];

  // Fetch first names for reviewers separately (no FK exists from rater_id to profiles)
  let raterNames: Record<string, string> = {};
  if (reviews.length > 0) {
    const { data: raterProfiles } = await (await createClient())
      .from('profiles')
      .select('id, display_name')
      .in('id', reviews.map((r) => r.rater_id));
    raterNames = Object.fromEntries(
      (raterProfiles ?? []).map((p) => [p.id, (p.display_name ?? '').trim().split(' ')[0] || 'Audience'])
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col">

      {/* Nav */}
      <nav className="bg-surface shadow-sm sticky top-0 z-50 w-full border-b border-outline-variant/30">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-gutter">
            <Link href="/" className="text-headline-md font-headline-md font-bold text-primary">Circle</Link>
            <div className="hidden md:flex gap-md items-center">
              <Link href="/discover" className="text-on-surface-variant font-medium text-body-md hover:text-primary transition-colors">Explore</Link>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            {isOwner ? (
              <Link href="/dashboard" className="text-label-mono font-label-mono text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                Dashboard
              </Link>
            ) : user ? (
              <Link href="/my-circle" className="text-label-mono font-label-mono text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                My Circle
              </Link>
            ) : (
              <Link href="/auth/signup" className="text-label-mono font-label-mono text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                Get started
              </Link>
            )}
            {user && <AccountMenu />}
          </div>
        </div>
      </nav>

      {/* Owner bar */}
      {isOwner && (
        <OwnerBar
          slug={params.slug}
          hasPhoto={!!artist.profile_photo}
          hasBio={!!artist.bio}
          hasTagline={!!artist.tagline}
          artistName={artist.name}
          artistPhoto={artist.profile_photo ?? null}
          artistTagline={(artist as Record<string, unknown>).tagline as string | null ?? null}
          artistBio={artist.bio ?? null}
          artistCity={(artist as Record<string, unknown>).city as string | null ?? null}
          artistCountry={(artist as Record<string, unknown>).country as string | null ?? null}
          artForms={Array.isArray(artist.art_forms) ? artist.art_forms as string[] : []}
          artistTags={Array.isArray(artist.tags) ? artist.tags as string[] : null}
          socialLinks={(artist.social_links as Record<string, string>) ?? {}}
          selectedWorks={(Array.isArray(artist.selected_works) ? artist.selected_works : []) as import('@/app/[slug]/_components/ExportModal').ExportWork[]}
          packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, duration: p.duration ?? null, description: p.description ?? null, logistics_inclusive: p.logistics_inclusive }))}
          savedEPK={(artist as Record<string, unknown>).epk_data as import('@/lib/exports/exportTypes').EPKFillable | null ?? null}
          savedRC={(artist as Record<string, unknown>).rate_card_data as import('@/lib/exports/exportTypes').RateCardFillable | null ?? null}
        />
      )}

      {/* Main */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter">

        {/* Left column: events */}
        <div className="md:col-span-3 relative order-last md:order-first">
          <div className="sticky top-24">
            <EventsSection
              initialEvents={events}
              isOwner={isOwner}
              artistSlug={artist.slug}
            />
          </div>
        </div>

        {/* Centre column: main content */}
        <div className="md:col-span-6 flex flex-col gap-lg">
          <EditableProfileHeader
            artist={{
              name: artist.name,
              tagline: artist.tagline,
              art_forms: artist.art_forms,
              tags: artist.tags,
              city: artist.city,
              country: artist.country,
              profile_photo: artist.profile_photo,
              social_links: artist.social_links as Record<string, string> | null,
            }}
            isOwner={isOwner}
          />

          <EditableBio bio={artist.bio} isOwner={isOwner} />

          <SelectedWorksGrid
            works={(Array.isArray(artist.selected_works) ? artist.selected_works : []) as Work[]}
            isOwner={isOwner}
          />

          <ProfileCircleNotes reviews={reviews} raterNames={raterNames} />
        </div>

        {/* Right column: packages */}
        <div className="md:col-span-3 relative">
          <div className="sticky top-24">
            <PackagesSection
              packages={packages}
              isOwner={isOwner}
              isLoggedIn={!!user}
              artist={{
                slug: artist.slug,
                name: artist.name,
                profile_photo: artist.profile_photo ?? null,
                social_links: (artist.social_links as Record<string, string>) ?? {},
                account_email: artist.account_email,
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-outline-variant w-full py-lg px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base mt-auto">
        <div className="text-body-md font-body-md font-bold text-primary">Circle</div>
        <div className="flex gap-md">
          {['Privacy', 'Terms', 'Support', 'Contact'].map((item) => (
            <a key={item} href="#" className="text-body-md font-body-md text-on-surface-variant hover:text-secondary transition-colors opacity-80 hover:opacity-100">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
