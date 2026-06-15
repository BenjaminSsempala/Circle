import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArtistByUserIdCached } from '@/lib/services/artists';
import { BookingsClient } from './_components/BookingsClient';

const TAB_STATES: Record<string, string[]> = {
  upcoming: ['ACCEPTED', 'CONTRACT_DRAFT', 'CONTRACT_SENT', 'AUDIENCE_UPLOADED', 'CONTRACT_SIGNED', 'PAYMENT_HELD', 'GIG_ACTIVE', 'CHECKED_IN', 'CONFIRMING'],
  requests: ['REQUESTED'],
  completed: ['COMPLETED', 'AUTO_RELEASED'],
  cancelled: ['CANCELLED', 'REFUNDED', 'DECLINED'],
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const artistResult = await getArtistByUserIdCached(user.id);
  const artist = artistResult.ok ? artistResult.artist : null;

  const tab = (searchParams.tab ?? 'upcoming') as keyof typeof TAB_STATES;
  const states = TAB_STATES[tab] ?? TAB_STATES.upcoming;

  let bookings: Record<string, unknown>[] = [];
  if (artist) {
    const { data } = await (await createClient())
      .from('bookings')
      .select('*, packages(name, duration)')
      .eq('artist_id', artist.id)
      .in('state', states)
      .order('created_at', { ascending: false });
    bookings = data ?? [];
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-6">Your Bookings</h1>
      <BookingsClient bookings={bookings} activeTab={tab} />
    </div>
  );
}
