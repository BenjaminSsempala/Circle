import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

// POST — invite an artist to a targeted gig
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const body = await request.json();
  const { artistId } = body as { artistId?: string };
  if (!artistId) return err('artistId is required');

  // Verify audience owns this gig
  const { data: gig } = await createServiceClient()
    .from('gig_posts')
    .select('audience_id, status')
    .eq('id', id)
    .maybeSingle();

  if (!gig) return err('Gig not found', 404);
  if (gig.audience_id !== user.id) return err('Forbidden', 403);
  if (gig.status !== 'open') return err('Gig is not open');

  const { error } = await (await createClient())
    .from('gig_invitations')
    .insert({ gig_post_id: id, artist_id: artistId });

  if (error) {
    if (error.code === '23505') return err('Artist already invited');
    return err(error.message);
  }

  return ok({ invited: true });
}
