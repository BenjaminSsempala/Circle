import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { getAllArtistEvents } from '@/lib/services/events';
import { DashboardEventsClient } from './_components/DashboardEventsClient';

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;
  if (!artist) redirect('/dashboard');

  const events = await getAllArtistEvents(artist.id);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Events</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Manage your upcoming shows and appearances.
        </p>
      </div>
      <DashboardEventsClient initialEvents={events} artistSlug={artist.slug} />
    </div>
  );
}
