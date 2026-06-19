export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const { data: bookings } = await (await createClient())
    .from('bookings')
    .select('artist_id, booking_type')
    .eq('audience_id', user.id)
    .in('state', ['COMPLETED', 'AUTO_RELEASED']);

  const bs = bookings ?? [];
  const artistCount = new Set(bs.map((b) => b.artist_id)).size;
  const performanceCount = bs.filter((b) => b.booking_type === 'performance').length;
  const workshopCount = bs.filter((b) => b.booking_type === 'workshop').length;
  const commissionedCount = bs.filter((b) => b.booking_type === 'commissioned_piece').length;

  const { count: savedCount } = await (await createClient())
    .from('saved_artists')
    .select('*', { count: 'exact', head: true })
    .eq('audience_id', user.id);

  return ok({ artistCount, performanceCount, workshopCount, commissionedCount, savedCount: savedCount ?? 0 });
}
