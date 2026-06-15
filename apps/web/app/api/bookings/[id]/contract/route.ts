export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { getBooking } from '@/lib/services/bookings';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await getBooking(params.id, user.id);
  if (!result.ok) return err(result.error, result.error === 'Forbidden' ? 403 : 404);
  if (!result.contract) return err('Contract not found', 404);

  return ok({ contract: result.contract, role: result.role });
}
