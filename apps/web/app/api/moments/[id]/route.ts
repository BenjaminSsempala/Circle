export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ok, err } from '@/lib/api';

async function getAuthorizedMoment(momentId: string, userId: string) {
  const svc = createServiceClient();
  const { data: moment } = await svc.from('moments').select('id,artist_id').eq('id', momentId).maybeSingle();
  if (!moment) return null;
  const { data: artist } = await svc.from('artists').select('user_id').eq('id', moment.artist_id).maybeSingle();
  if (!artist || artist.user_id !== userId) return null;
  return moment;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const moment = await getAuthorizedMoment(params.id, user.id);
  if (!moment) return err('Not found or forbidden', 404);

  const body = await req.json();
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('moments')
    .update({ story: body.story, occasion_type: body.occasion_type ?? null, photo_url: body.photo_url ?? null, display_order: body.display_order ?? 0 })
    .eq('id', params.id)
    .select()
    .single();
  if (error) return err(error.message, 500);
  return ok({ moment: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err('Unauthorized', 401);

  const moment = await getAuthorizedMoment(params.id, user.id);
  if (!moment) return err('Not found or forbidden', 404);

  const svc = createServiceClient();
  await svc.from('moments').delete().eq('id', params.id);
  return ok({ ok: true });
}
