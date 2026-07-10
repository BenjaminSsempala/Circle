import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

// GET — list applications (audience owner only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  // Verify ownership
  const { data: gig } = await createServiceClient()
    .from('gig_posts')
    .select('audience_id')
    .eq('id', id)
    .maybeSingle();

  if (!gig) return err('Gig not found', 404);
  if (gig.audience_id !== user.id) return err('Forbidden', 403);

  // Fetch applications with artist data and packages
  const { data, error } = await createServiceClient()
    .from('gig_applications')
    .select(`
      *,
      artists (
        id,
        display_name,
        profile_photo,
        slug
      ),
      packages (
        id,
        name,
        description,
        price,
        currency,
        duration
      )
    `)
    .eq('gig_post_id', id)
    .order('applied_at', { ascending: true });

  if (error) return err(error.message);
  return ok({ applications: data ?? [] });
}
