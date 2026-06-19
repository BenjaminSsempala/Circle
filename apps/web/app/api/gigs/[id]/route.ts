import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

// GET — get single gig post
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data, error } = await createServiceClient()
    .from('gig_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return err('Gig not found', 404);
  return ok({ gig: data });
}

// PATCH — update gig post (audience owner only, status must be 'open')
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const { data: gig } = await createServiceClient()
    .from('gig_posts')
    .select('audience_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!gig) return err('Gig not found', 404);
  if (gig.audience_id !== user.id) return err('Forbidden', 403);
  if (gig.status !== 'open') return err('Only open gigs can be edited');

  const body = await request.json();
  const allowed = ['title', 'discipline', 'slot_duration', 'budget', 'currency', 'technical_requirements', 'description', 'gig_date', 'venue', 'visibility'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await (await createClient())
    .from('gig_posts')
    .update(update)
    .eq('id', id)
    .eq('audience_id', user.id)
    .select()
    .single();

  if (error || !data) return err(error?.message ?? 'Failed to update gig');
  return ok({ gig: data });
}

// DELETE — cancel gig post (sets status='cancelled')
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const { data, error } = await (await createClient())
    .from('gig_posts')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('audience_id', user.id)
    .select()
    .single();

  if (error || !data) return err(error?.message ?? 'Failed to cancel gig');
  return ok({ gig: data });
}
