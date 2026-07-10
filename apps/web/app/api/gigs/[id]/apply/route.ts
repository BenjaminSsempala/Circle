import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { applyToGig } from '@/lib/services/gigs';

// POST — artist applies to gig
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const body = await request.json();
  const result = await applyToGig(user.id, id, {
    message: body.message,
    referencedPackageId: body.referencedPackageId,
  });

  if (!result.ok) return err((result as { ok: false; error: string }).error);
  return ok({ application: result.application }, 201);
}
