import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { createGigPost, listGigsForArtist } from '@/lib/services/gigs';

// POST — create gig (audience only)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  // Verify audience role: must have no artist row
  const { data: artistRow } = await (await createClient())
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (artistRow) return err('Artists cannot post gigs', 403);

  const body = await request.json();
  const result = await createGigPost(user.id, body);

  if (!result.ok) return err((result as { ok: false; error: string }).error);
  return ok({ gigPost: result.gigPost }, 201);
}

// GET — list gigs for artist feed (artist only)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const { data: artist } = await (await createClient())
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!artist) return err('Artist profile not found', 404);

  const url = new URL(request.url);
  const discipline = url.searchParams.getAll('discipline');
  const budgetMin = url.searchParams.get('budgetMin');
  const budgetMax = url.searchParams.get('budgetMax');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const gigs = await listGigsForArtist(artist.id, {
    discipline: discipline.length > 0 ? discipline : undefined,
    budgetMin: budgetMin ? Number(budgetMin) : undefined,
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    dateFrom: dateFrom ?? undefined,
    dateTo: dateTo ?? undefined,
  });

  return ok({ gigs });
}
