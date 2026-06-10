export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, upsertPackage } from '@/lib/services/artists';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) return err('Artist profile not found', 404);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { name, description, price, currency, duration, logisticsInclusive } = body as {
    name?: string; description?: string; price?: number;
    currency?: string; duration?: string; logisticsInclusive?: boolean;
  };

  if (!name || price === undefined || !description) return err('name, price, and description are required');

  const result = await upsertPackage(artistResult.artist.id, {
    name, description: description ?? '', price: Number(price),
    currency: currency ?? 'UGX', duration: duration ?? '1 hour',
    logisticsInclusive: logisticsInclusive ?? false,
  });

  if (!result.ok) return err(result.error, 500);
  return ok({ package: result.package });
}
