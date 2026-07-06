export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, createPackage } from '@/lib/services/artists';
import { logger, withAxiom } from '@/lib/axiom/server';

// POST: create first package (Step 2)
export const POST = withAxiom(async (request: Request) => {
  const context = { endpoint: '/api/onboarding/package', method: 'POST' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Package creation rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    logger.warn('Package creation validation failed: Invalid JSON format', { ...context, userId: user.id });
    return err('Invalid JSON body');
  }

  const { packageName, description, price, currency, duration, logisticsInclusive } = body as {
    packageName?: string;
    description?: string;
    price?: string | number;
    currency?: string;
    duration?: string;
    logisticsInclusive?: boolean;
  };

  if (!packageName || !price || !description) {
    logger.warn('Package creation validation failed: Missing required fields', { 
      ...context, 
      userId: user.id,
      missingFields: Object.entries({ packageName, price, description })
        .filter(([_, val]) => !val)
        .map(([key]) => key)
    });
    return err('Missing required fields: packageName, price, description');
  }

  // Resolve the artist record for this user
  logger.info('Resolving artist validation state for package processing', { ...context, userId: user.id });
  const artistResult = await getArtistByUserId(user.id);
  
  if (!artistResult.ok) {
    logger.error('Failed to resolve artist context payload during package creation', { ...context, userId: user.id, error: artistResult.error });
    return err(artistResult.error, 500);
  }
  
  if (!artistResult.artist) {
    logger.warn('Package creation sequence out-of-order: Missing underlying artist profile', { ...context, userId: user.id });
    return err('Artist profile not found. Complete Step 1 first.', 400);
  }

  const parsedPrice = parseFloat(String(price));
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    logger.warn('Package creation validation failed: Malformed numeric price input', { ...context, userId: user.id, rawPrice: price });
    return err('Price must be a valid positive number');
  }

  logger.info('Writing new inventory package record', { 
    ...context, 
    userId: user.id, 
    artistId: artistResult.artist.id,
    currency: currency || 'UGX',
    price: parsedPrice 
  });

  const pkgResult = await createPackage(artistResult.artist.id, {
    name: packageName,
    description,
    price: parsedPrice,
    currency: (currency as string) || 'UGX',
    duration: (duration as string) || '1 hour',
    logisticsInclusive: !!logisticsInclusive,
  });

  if (!pkgResult.ok) {
    logger.error('Database write exception encountered creating inventory package', { 
      ...context, 
      userId: user.id, 
      artistId: artistResult.artist.id, 
      error: pkgResult.error 
    });
    return err(pkgResult.error, 500);
  }

  logger.info('Inventory package created successfully', { 
    ...context, 
    userId: user.id, 
    artistId: artistResult.artist.id, 
    packageId: pkgResult.package?.id 
  });
  
  return ok({ package: pkgResult.package });
});