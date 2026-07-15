import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { getPackageInspiration } from '@/lib/services/inspiration';
import { resolvePackagePrefill, type PackageRow } from '@/lib/packages/prefill';
import { PackagesClient } from './_components/PackagesClient';

export default async function PackagesPage({
  searchParams,
}: {
  searchParams?: { template?: string; example?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;
  if (!artist) redirect('/dashboard');

  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: true });

  const primaryArtForm = Array.isArray(artist.art_forms) ? artist.art_forms[0] ?? null : null;

  // Resolve ?template / ?example into a pre-filled form (template wins). Example packages
  // belong to other artists, so they are fetched by id under public-read RLS.
  const prefill = await resolvePackagePrefill({
    template: searchParams?.template ?? null,
    example: searchParams?.example ?? null,
    fetchExample: async (packageId: string): Promise<PackageRow | null> => {
      const { data } = await supabase
        .from('packages')
        .select('id, name, description, price, currency, duration, logistics_inclusive, product_type, auto_accept, contract_required, is_active')
        .eq('id', packageId)
        .eq('is_active', true)
        .maybeSingle();
      return (data as PackageRow | null) ?? null;
    },
  });

  const inspiration = await getPackageInspiration({
    excludeArtistId: artist.id,
    artForm: primaryArtForm,
    limit: 24,
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">My Packages</h1>
      </div>
      <p className="text-body-md font-body-md text-on-surface-variant mb-8">
        Manage your service offerings and pricing.
      </p>
      <PackagesClient
        initialPackages={packages ?? []}
        artist={artist}
        inspiration={inspiration}
        initialPrefill={prefill}
        openDrawer={!!prefill}
      />
    </div>
  );
}
