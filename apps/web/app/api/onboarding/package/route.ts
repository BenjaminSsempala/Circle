export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getArtistByUserId, createPackage } from '@/lib/services/artists';

// POST — create first package (Step 2)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
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
    return err('Missing required fields: packageName, price, description');
  }

  // Resolve the artist record for this user
  const artistResult = await getArtistByUserId(user.id);
  if (!artistResult.ok) return err(artistResult.error, 500);
  if (!artistResult.artist) {
    return err('Artist profile not found. Complete Step 1 first.', 400);
  }

  const parsedPrice = parseFloat(String(price));
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return err('Price must be a valid positive number');
  }

  const pkgResult = await createPackage(artistResult.artist.id, {
    name: packageName,
    description,
    price: parsedPrice,
    currency: (currency as string) || 'UGX',
    duration: (duration as string) || '1 hour',
    logisticsInclusive: !!logisticsInclusive,
  });

  if (!pkgResult.ok) return err(pkgResult.error, 500);
  return ok({ package: pkgResult.package });
}
