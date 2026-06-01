import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, createPackage } from '@/lib/services/artists';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) return err('Artist not found', 404);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { name, description, price, currency, duration, logisticsInclusive } = body as {
    name?: string; description?: string; price?: number;
    currency?: string; duration?: string; logisticsInclusive?: boolean;
  };

  if (!name || price === undefined) return err('name and price are required');

  const result = await createPackage(artistResult.artist.id, {
    name,
    description: description ?? '',
    price: Number(price),
    currency: currency ?? 'UGX',
    duration: duration ?? '',
    logisticsInclusive: logisticsInclusive ?? false,
  });

  if (!result.ok) return err(result.error, 500);
  return ok({ package: result.package }, 201);
}
