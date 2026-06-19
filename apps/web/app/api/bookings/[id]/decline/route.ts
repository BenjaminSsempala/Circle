export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { transitionBooking } from '@/lib/services/bookings';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await transitionBooking(params.id, 'DECLINED', user.id);
  if (!result.ok) return err(result.error, 400);
  return ok({ booking: result.booking });
}
