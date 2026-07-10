import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { selectGigApplicant } from '@/lib/services/gigs';

// POST — select applicant, triggers conversion to booking
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  const { id, appId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const result = await selectGigApplicant(user.id, id, appId);

  if (!result.ok) return err((result as { ok: false; error: string }).error);
  return ok({ booking: result.booking });
}
