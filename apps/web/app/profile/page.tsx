import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AudienceProfileClient } from './_components/AudienceProfileClient';

export default async function AudienceProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: profile }, { data: saved }, { count: bookingCount }] = await Promise.all([
    supabase.from('profiles').select('display_name, role, occasion_type').eq('id', user.id).maybeSingle(),
    supabase.from('saved_artists').select('artist_id').eq('audience_id', user.id),
    supabase.from('bookings').select('*', { count: 'estimated', head: true }).eq('audience_id', user.id),
  ]);

  if (profile?.role === 'artist') redirect('/dashboard');

  return (
    <AudienceProfileClient
      user={{ id: user.id, email: user.email ?? '', fullName: profile?.display_name ?? '' }}
      occasionType={profile?.occasion_type ?? null}
      savedCount={(saved ?? []).length}
      bookingCount={bookingCount ?? 0}
    />
  );
}
