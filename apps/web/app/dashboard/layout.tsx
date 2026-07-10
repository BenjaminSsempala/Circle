import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { DashboardShell } from './_components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Run profile check and artist lookup in parallel
  const [{ data: profile }, artistResult] = await Promise.all([
    supabase.from('profiles').select('role, display_name').eq('id', user.id).maybeSingle(),
    getArtistByUserIdCached(user.id),
  ]);

  if (profile?.role === 'audience') redirect('/discover');

  const artist = artistResult.ok ? artistResult.artist : null;

  return (
    <DashboardShell
      artistName={artist?.display_name ?? profile?.display_name ?? ''}
      artistSlug={artist?.slug ?? ''}
      artistPhoto={artist?.profile_photo ?? null}
    >
      {children}
    </DashboardShell>
  );
}
