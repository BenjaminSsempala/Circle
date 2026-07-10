export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { createBooking, listBookings, type CreateBookingInput, type ProductType } from '@/lib/services/bookings';
import { logger, withAxiom } from '@/lib/axiom/server';

export const POST = withAxiom(async (request: Request) => {
  const context = { endpoint: '/api/bookings', method: 'POST' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Booking creation rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  let body: Record<string, unknown>;
  try { 
    body = await request.json(); 
  } catch { 
    logger.warn('Booking creation validation failed: Invalid JSON format', { ...context, userId: user.id });
    return err('Invalid JSON'); 
  }

  const { packageId, productType, gigDate, gigTime, venue, deliveryDate, specialRequirements, audienceNotes, brandTerms, legalName } = body as {
    packageId?: string;
    productType?: ProductType;
    gigDate?: string;
    gigTime?: string;
    venue?: string;
    deliveryDate?: string;
    specialRequirements?: string;
    audienceNotes?: string;
    brandTerms?: import('@/lib/services/bookings').BrandTerms;
    legalName?: string;
  };

  if (!packageId) {
    logger.warn('Booking creation validation failed: Missing packageId', { ...context, userId: user.id });
    return err('packageId is required');
  }
  if (!productType || !['service', 'digital', 'merchandise'].includes(productType)) {
    logger.warn('Booking creation validation failed: Invalid productType', { ...context, userId: user.id, productType });
    return err('productType must be one of service, digital, merchandise');
  }

  const { data: profile, error: profileFetchError } = await (await createClient())
    .from('profiles')
    .select('display_name, legal_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileFetchError) {
    logger.error('Database fetch failed: Unable to read user profile context during booking', { ...context, userId: user.id, error: profileFetchError.message });
  }

  // Save legal_name to profile if not already set and provided
  if (legalName && !profile?.legal_name) {
    logger.info('Updating missing legal name on profile during booking checkout', { ...context, userId: user.id });
    const { error: updateError } = await (await createClient())
      .from('profiles')
      .update({ legal_name: legalName })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Database update failed: Could not save legal name to profile during booking', { ...context, userId: user.id, error: updateError.message });
    }
  }

  const input: CreateBookingInput = {
    packageId,
    productType,
    gigDate,
    gigTime,
    venue,
    deliveryDate,
    specialRequirements,
    audienceNotes,
    brandTerms,
  };

  logger.info('Initiating transactional booking flow', { ...context, userId: user.id, packageId, productType });
  const result = await createBooking(
    { id: user.id, name: profile?.display_name ?? user.email ?? 'Audience member', email: user.email ?? '' },
    input,
  );

  if (!result.ok) {
    logger.error('Booking processing pipeline failure', { ...context, userId: user.id, packageId, error: result.error });
    return err(result.error, 400);
  }

  logger.info('Booking transaction completed successfully', { 
    ...context, 
    userId: user.id, 
    bookingId: result.booking?.id, 
    packageId 
  });
  
  return ok({ booking: result.booking, artistContact: result.artistContact }, 201);
});

export const GET = withAxiom(async (request: Request) => {
  const context = { endpoint: '/api/bookings', method: 'GET' };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    logger.warn('Bookings fetch rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role');

  const { data: artist, error: artistFetchError } = await (await createClient())
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (artistFetchError) {
    logger.error('Database fetch failed: Unable to check artist profile state', { ...context, userId: user.id, error: artistFetchError.message });
  }

  const role: 'artist' | 'audience' = roleParam === 'artist' && artist ? 'artist' : 'audience';

  logger.info('Querying bookings list index', { ...context, userId: user.id, evaluatedRole: role, requestedRoleParam: roleParam });
  const result = await listBookings(user.id, role);
  
  if (!result.ok) {
    logger.error('Failed to compile user bookings payload', { ...context, userId: user.id, evaluatedRole: role, error: result.error });
    return err(result.error, 500);
  }

  return ok({ bookings: result.bookings });
});