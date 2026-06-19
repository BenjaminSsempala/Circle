import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

// GET — list gig posts created by the current audience member
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  // Fetch gig posts with application counts
  const { data: gigs, error } = await createServiceClient()
    .from('gig_posts')
    .select('*')
    .eq('audience_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return err(error.message);

  if (!gigs || gigs.length === 0) return ok({ gigs: [] });

  // Fetch application counts per gig
  const gigIds = gigs.map((g: { id: string }) => g.id);
  const { data: counts } = await createServiceClient()
    .from('gig_applications')
    .select('gig_post_id')
    .in('gig_post_id', gigIds);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.gig_post_id, (countMap.get(row.gig_post_id) ?? 0) + 1);
  }

  const gigsWithCounts = gigs.map((g: { id: string }) => ({
    ...g,
    application_count: countMap.get(g.id) ?? 0,
  }));

  return ok({ gigs: gigsWithCounts });
}
