import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const { error } = await supabase
    .from('saved_artists')
    .delete()
    .eq('audience_id', user.id)
    .eq('artist_id', params.id);

  if (error) return err(error.message, 500);
  return ok({ ok: true });
}
