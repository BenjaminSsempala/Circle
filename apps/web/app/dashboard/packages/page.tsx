import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { PackagesClient } from './_components/PackagesClient';

export default async function PackagesPage() {
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
      />
    </div>
  );
}
