import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';
import { logger, withAxiom } from '@/lib/axiom/server';

// GET — list gig posts created by the current audience member
export const GET = withAxiom(async () => {
  const context = { endpoint: '/api/gigs', method: 'GET' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    logger.warn('Gig index fetch rejected: Unauthenticated session', { ...context });
    return err('Unauthorized', 401);
  }

  logger.info('Fetching audience gig posts index', { ...context, userId: user.id });

  // Fetch gig posts with application counts
  const { data: gigs, error } = await createServiceClient()
    .from('gig_posts')
    .select('*')
    .eq('audience_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Database query failure reading audience gig posts', { 
      ...context, 
      userId: user.id, 
      error: error.message 
    });
    return err(error.message);
  }

  if (!gigs || gigs.length === 0) {
    logger.info('Gig index lookup finished: No active posts found', { ...context, userId: user.id });
    return ok({ gigs: [] });
  }

  // Fetch application counts per gig
  const gigIds = gigs.map((g: { id: string }) => g.id);
  logger.info('Aggregating applications volume context for target gig listings', { 
    ...context, 
    userId: user.id, 
    gigsCount: gigIds.length 
  });

  const { data: counts, error: countsError } = await createServiceClient()
    .from('gig_applications')
    .select('gig_post_id')
    .in('gig_post_id', gigIds);

  if (countsError) {
    logger.error('Database query failure aggregating gig applications relational volume', {
      ...context,
      userId: user.id,
      error: countsError.message
    });
  }

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.gig_post_id, (countMap.get(row.gig_post_id) ?? 0) + 1);
  }

  const gigsWithCounts = gigs.map((g: { id: string }) => ({
    ...g,
    application_count: countMap.get(g.id) ?? 0,
  }));

  logger.info('Audience gig index map successfully assembled', { 
    ...context, 
    userId: user.id, 
    totalMatches: gigsWithCounts.length 
  });

  return ok({ gigs: gigsWithCounts });
});