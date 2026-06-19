export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { updateCustomClauses } from '@/lib/services/contracts';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const { clauses } = body as { clauses?: unknown };
  if (!Array.isArray(clauses) || !clauses.every((c) => typeof c === 'string')) {
    return err('clauses must be an array of strings');
  }

  const result = await updateCustomClauses(params.id, user.id, clauses);
  if (!result.ok) return err(result.error, 400);
  return ok({ contract: result.contract });
}
