export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, upsertPackage, deletePackage } from '@/lib/services/artists';
import { logger, withAxiom } from '@/lib/axiom/server';

export const PATCH = withAxiom(async (request: Request, { params }: { params: { id: string } }) => {
  const context = { endpoint: '/api/packages/[id]', method: 'PATCH', packageId: params.id };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Package updating rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) {
    logger.warn('Package updating aborted: User profile context has no artist record', { ...context, userId: user.id });
    return err('Artist not found', 404);
  }

  let body: Record<string, unknown>;
  try { 
    body = await request.json(); 
  } catch { 
    logger.warn('Package updating validation failed: Invalid JSON format', { ...context, userId: user.id, artistId: artistResult.artist.id });
    return err('Invalid JSON'); 
  }

  const { name, description, price, currency, duration, logisticsInclusive, is_active, productType, autoAccept, contractRequired } = body as {
    name?: string; description?: string; price?: number;
    currency?: string; duration?: string; logisticsInclusive?: boolean;
    is_active?: boolean; productType?: 'service' | 'digital' | 'merchandise';
    autoAccept?: boolean; contractRequired?: boolean;
  };

  if (!name || price === undefined || !description) {
    logger.warn('Package updating validation failed: Missing required payload properties', { ...context, userId: user.id, artistId: artistResult.artist.id });
    return err('name, price, and description are required');
  }

  logger.info('Initiating upsert mutation on inventory package row', { ...context, userId: user.id, artistId: artistResult.artist.id, productType });
  const result = await upsertPackage(artistResult.artist.id, {
    id: params.id,
    name, description: description ?? '', price: Number(price),
    currency: currency ?? 'UGX', duration: duration ?? '1 hour',
    logisticsInclusive: logisticsInclusive ?? false,
    isActive: is_active, productType, autoAccept, contractRequired,
  });

  if (!result.ok) {
    logger.error('Database write exception encountered modifying inventory package row', { ...context, userId: user.id, artistId: artistResult.artist.id, error: result.error });
    return err(result.error, 500);
  }

  logger.info('Inventory package properties updated successfully', { ...context, userId: user.id, artistId: artistResult.artist.id });
  return ok({ package: result.package });
});

export const DELETE = withAxiom(async (_req: Request, { params }: { params: { id: string } }) => {
  const context = { endpoint: '/api/packages/[id]', method: 'DELETE', packageId: params.id };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Package deletion rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok || !artistResult.artist) {
    logger.warn('Package deletion aborted: User profile context has no artist record', { ...context, userId: user.id });
    return err('Artist not found', 404);
  }

  logger.info('Initiating hard-delete transaction on package inventory row', { ...context, userId: user.id, artistId: artistResult.artist.id });
  const result = await deletePackage(params.id, artistResult.artist.id);
  
  if (!result.ok) {
    logger.error('Database destruction transaction failed removing package row', { ...context, userId: user.id, artistId: artistResult.artist.id, error: result.error });
    return err(result.error, 500);
  }

  logger.info('Package inventory record removed completely', { ...context, userId: user.id, artistId: artistResult.artist.id });
  return ok({ ok: true });
});