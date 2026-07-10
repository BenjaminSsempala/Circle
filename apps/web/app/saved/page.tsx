import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { SavedClient } from './_components/SavedClient';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import type { DiscoverArtist } from '@/app/components/discover/ArtistCard';
import NavbarSavedClient from './_components/NavbarSavedClient';

export default async function SavedPage() {
  const anonSupabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: savedRows } = await supabase
    .from('saved_artists')
    .select('artist_id')
    .eq('audience_id', user.id);

  const savedIds = (savedRows ?? []).map((r) => r.artist_id);

  let artists: DiscoverArtist[] = [];
  if (savedIds.length > 0) {
    const [{ data: artistRows }, { data: packages }] = await Promise.all([
      anonSupabase.from('artists').select('*').in('id', savedIds),
      anonSupabase.from('packages').select('artist_id, name, price, currency').eq('is_active', true).in('artist_id', savedIds),
    ]);

    const priceMap = new Map<string, { min: number; currency: string; name: string }>();
    for (const pkg of packages ?? []) {
      const existing = priceMap.get(pkg.artist_id);
      if (!existing || pkg.price < existing.min) {
        priceMap.set(pkg.artist_id, { min: pkg.price, currency: pkg.currency ?? 'UGX', name: pkg.name });
      }
    }

    artists = (artistRows ?? []).map((a) => {
      const priceInfo = priceMap.get(a.id);
      return {
        id: a.id, slug: a.slug, name: a.display_name ?? a.name, bio: a.bio,
        profile_photo: a.profile_photo, art_forms: a.art_forms ?? [],
        tags: a.tags ?? [], city: a.city, country: a.country,
        completed_bookings: a.completed_bookings ?? 0,
        min_price: priceInfo?.min, currency: priceInfo?.currency,
        min_package_name: priceInfo?.name,
      };
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile-Responsive Navigation Component */}
      <NavbarSavedClient accountMenu={<AccountMenu />} />

      {/* Main Container — flex-1 ensures it pushes the footer to the bottom */}
      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 w-full">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <h1 className="text-headline-md sm:text-headline-lg font-headline-lg text-on-surface">Saved artists</h1>
          {savedIds.length > 0 && (
            <span className="bg-primary text-on-primary text-xs font-bold px-2.5 py-1 rounded-full">
              {savedIds.length}
            </span>
          )}
        </div>

        <SavedClient initialArtists={artists} initialSavedIds={savedIds} />
      </main>

      {/* Fixed Footer Responsive Layout */}
      <footer className="border-t border-outline-variant/20 py-6 md:py-8 px-4 sm:px-6 md:px-10 shrink-0">
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