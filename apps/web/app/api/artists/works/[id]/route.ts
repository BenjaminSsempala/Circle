export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { updateWork, deleteWork } from '@/lib/services/artists';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const result = await updateWork(user.id, params.id, body as Parameters<typeof updateWork>[2]);
  if (!result.ok) return err(result.error, 500);
  return ok({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await deleteWork(user.id, params.id);
  if (!result.ok) return err(result.error, 500);
  return ok({ ok: true });
}
