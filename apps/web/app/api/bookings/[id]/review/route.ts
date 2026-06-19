export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const { stars, comment } = await req.json();
  if (!stars || stars < 1 || stars > 5) return err('stars must be 1–5', 400);

  const svc = createServiceClient();

  // Verify booking exists and audience is this user
  const { data: booking, error: bErr } = await svc
    .from('bookings')
    .select('id, state, artist_id, audience_id')
    .eq('id', params.id)
    .maybeSingle();
  if (bErr || !booking) return err('Booking not found', 404);
  if (booking.audience_id !== user.id) return err('Only the audience can leave a review', 403);
  if (booking.state !== 'COMPLETED' && booking.state !== 'AUTO_RELEASED') return err('Booking must be completed first', 400);

  // Get artist user_id from artists table
  const { data: artist, error: aErr } = await svc
    .from('artists')
    .select('user_id')
    .eq('id', booking.artist_id)
    .maybeSingle();
  if (aErr || !artist) return err('Artist not found', 404);

  const { error: insertErr } = await svc.from('reviews').insert({
    booking_id: params.id,
    rater_id: user.id,
    ratee_id: artist.user_id,
    stars,
    comment: comment ?? null,
  });
  if (insertErr) {
    if (insertErr.code === '23505') return err('You have already reviewed this booking', 409);
    return err(insertErr.message, 500);
  }

  return ok({ ok: true });
}
