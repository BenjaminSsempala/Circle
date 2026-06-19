import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { AvailabilityClient } from './_components/AvailabilityClient';

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;
  if (!artist) redirect('/dashboard');

  let blackouts: { date: string }[] = [];
  let bookedDates: { date: string; booking_id: string | null }[] = [];

  try {
    const { data } = await supabase
      .from('availability')
      .select('date, type, booking_id')
      .eq('artist_id', artist.id);

    blackouts = (data ?? []).filter((r) => r.type === 'blackout').map((r) => ({ date: r.date }));
    bookedDates = (data ?? []).filter((r) => r.type === 'booked').map((r) => ({ date: r.date, booking_id: r.booking_id }));
  } catch { /* availability table not yet created */ }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-1">Availability Calendar</h1>
      <p className="text-body-md font-body-md text-on-surface-variant mb-8">
        Manage your professional schedule
      </p>
      <AvailabilityClient
        artistSlug={artist.slug}
        initialBlackouts={blackouts.map((b) => b.date)}
        bookedDates={bookedDates.map((b) => b.date)}
      />
    </div>
  );
}
