import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getBooking } from '@/lib/services/bookings';
import { MemoryMomentClient } from './MemoryMomentClient';
import { AccountMenu } from '@/app/components/nav/AccountMenu';

export default async function MemoryPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/booking/${params.id}/memory`);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return notFound();

  const { booking, role } = result;
  if (role === 'artist') redirect(`/booking/${params.id}`);
  if (booking.state !== 'COMPLETED' && booking.state !== 'AUTO_RELEASED') redirect(`/booking/${params.id}`);

  const artist = (booking as unknown as {
    artists: { name: string; slug: string; profile_photo: string | null };
  }).artists;
  const pkg = (booking as unknown as { packages: { name: string } | null }).packages;

  // Check for existing review
  const { data: existingReview } = await (await createClient())
    .from('reviews')
    .select('mood, comment')
    .eq('booking_id', booking.id)
    .eq('rater_id', user.id)
    .maybeSingle();

  const eventDate = booking.gig_date ?? booking.delivery_date ?? booking.created_at.split('T')[0];

  return (
    <div className="bg-[#F5F3EF] min-h-screen font-sans">
      <nav className="bg-white shadow-sm sticky top-0 z-10 w-full border-b border-primary/10">
        <div className="flex justify-between items-center w-full px-4 h-16 max-w-xl mx-auto">
          <Link href="/" className="text-lg font-bold text-primary">Circle</Link>
          <div className="flex items-center gap-3">
            <Link href={`/booking/${params.id}`} className="text-xs font-mono uppercase tracking-[0.2em] text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">
              Back to booking
            </Link>
            <AccountMenu />
          </div>
        </div>
      </nav>
      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-10">
        <MemoryMomentClient
          bookingId={params.id}
          artistName={artist.name}
          artistSlug={artist.slug}
          artistPhoto={artist.profile_photo}
          packageName={pkg?.name ?? 'Booking'}
          eventDate={eventDate}
          existingMood={existingReview?.mood ?? null}
          existingComment={existingReview?.comment ?? null}
        />
      </main>
    </div>
  );
}
