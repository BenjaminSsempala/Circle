import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getArtistBySlug } from '@/lib/services/artists';
import { OwnerBar } from './_components/OwnerBar';
import { EditableProfileHeader } from './_components/EditableProfileHeader';
import { EditableBio } from './_components/EditableBio';
import { PackagesSection } from './_components/PackagesSection';
import { SelectedWorksGrid } from './_components/SelectedWorksGrid';
import type { Work } from '@/lib/services/artists';

export default async function ArtistProfilePage({ params }: { params: { slug: string } }) {
  const [result, supabase] = await Promise.all([
    getArtistBySlug(params.slug),
    createClient(),
  ]);

  if (!result.ok) return notFound();

  const { artist, packages } = result;
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === artist.user_id;

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
            ) : (
              <Link href="/auth/signup" className="text-label-mono font-label-mono text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-on-primary transition-colors">
                Get started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Owner bar */}
      {isOwner && (
        <OwnerBar
          slug={params.slug}
          hasPhoto={!!artist.profile_photo}
          hasBio={!!artist.bio}
        />
      )}

      {/* Main */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter">

        {/* Left column */}
        <div className="md:col-span-8 flex flex-col gap-lg">
          <EditableProfileHeader
            artist={{
              name: artist.name,
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
        </div>

        {/* Right column — sticky packages */}
        <div className="md:col-span-4 relative">
          <div className="sticky top-24">
            <PackagesSection packages={packages} isOwner={isOwner} />
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
