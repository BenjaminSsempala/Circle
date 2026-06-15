export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { createBooking, listBookings, type CreateBookingInput, type ProductType } from '@/lib/services/bookings';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { packageId, productType, gigDate, gigTime, venue, deliveryDate, specialRequirements, audienceNotes } = body as {
    packageId?: string;
    productType?: ProductType;
    gigDate?: string;
    gigTime?: string;
    venue?: string;
    deliveryDate?: string;
    specialRequirements?: string;
    audienceNotes?: string;
  };

  if (!packageId) return err('packageId is required');
  if (!productType || !['service', 'digital', 'merchandise'].includes(productType)) {
    return err('productType must be one of service, digital, merchandise');
  }

  const { data: profile } = await (await createClient())
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const input: CreateBookingInput = {
    packageId,
    productType,
    gigDate,
    gigTime,
    venue,
    deliveryDate,
    specialRequirements,
    audienceNotes,
  };

  const result = await createBooking(
    { id: user.id, name: profile?.full_name ?? user.email ?? 'Audience member', email: user.email ?? '' },
    input,
  );

  if (!result.ok) return err(result.error, 400);
  return ok({ booking: result.booking, artistContact: result.artistContact }, 201);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role');

  const { data: artist } = await (await createClient())
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const role: 'artist' | 'audience' = roleParam === 'artist' && artist ? 'artist' : 'audience';

  const result = await listBookings(user.id, role);
  if (!result.ok) return err(result.error, 500);
  return ok({ bookings: result.bookings });
}
