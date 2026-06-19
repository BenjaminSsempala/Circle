export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const svc = createServiceClient();
  const { data: artist } = await svc.from('artists').select('id').eq('slug', params.slug).maybeSingle();
  if (!artist) return err('Artist not found', 404);
  const { data } = await svc.from('moments').select('*').eq('artist_id', artist.id).order('display_order');
  return ok({ moments: data ?? [] });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const svc = createServiceClient();
  const { data: artist } = await svc.from('artists').select('id,user_id').eq('slug', params.slug).maybeSingle();
  if (!artist || artist.user_id !== user.id) return err('Forbidden', 403);

  const body = await req.json();
  const { story, occasion_type, photo_url, display_order } = body;
  if (!story || story.length > 1000) return err('Story required (max 1000 chars)', 400);

  const { data: moment, error } = await svc
    .from('moments')
    .insert({ artist_id: artist.id, story, occasion_type: occasion_type ?? null, photo_url: photo_url ?? null, display_order: display_order ?? 0 })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return ok({ moment });
}
