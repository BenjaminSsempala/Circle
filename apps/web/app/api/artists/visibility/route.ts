export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (body === null || typeof body.is_visible !== 'boolean') {
    return err('is_visible (boolean) is required', 400);
  }

  const { error } = await supabase
    .from('artists')
    .update({ is_visible: body.is_visible })
    .eq('user_id', user.id);

  if (error) return err(error.message, 500);

  return ok({ is_visible: body.is_visible });
}
