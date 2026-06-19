export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, upsertPackage, deletePackage } from '@/lib/services/artists';

async function resolveArtistId(userId: string) {
  const { getArtistByUserId: get } = await import('@/lib/services/artists');
  const r = await get(userId);
  return r.ok && r.artist ? r.artist.id : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) return err('Artist not found', 404);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { name, description, price, currency, duration, logisticsInclusive, is_active, productType, autoAccept, contractRequired } = body as {
    name?: string; description?: string; price?: number;
    currency?: string; duration?: string; logisticsInclusive?: boolean;
    is_active?: boolean; productType?: 'service' | 'digital' | 'merchandise';
    autoAccept?: boolean; contractRequired?: boolean;
  };

  if (!name || price === undefined || !description) return err('name, price, and description are required');

  const result = await upsertPackage(artistResult.artist.id, {
    id: params.id,
    name, description: description ?? '', price: Number(price),
    currency: currency ?? 'UGX', duration: duration ?? '1 hour',
    logisticsInclusive: logisticsInclusive ?? false,
    isActive: is_active, productType, autoAccept, contractRequired,
  });

  if (!result.ok) return err(result.error, 500);
  return ok({ package: result.package });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) return err('Artist not found', 404);

  const result = await deletePackage(params.id, artistResult.artist.id);
  if (!result.ok) return err(result.error, 500);
  return ok({ ok: true });
}
