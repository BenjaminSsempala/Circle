export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId } from '@/lib/services/artists';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) return err('Artist not found', 404);

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('artist_id', artistResult.artist.id)
      .order('created_at', { ascending: false });

    if (error) return ok({ bookings: [] });
    return ok({ bookings: data ?? [] });
  } catch {
    return ok({ bookings: [] });
  }
}
