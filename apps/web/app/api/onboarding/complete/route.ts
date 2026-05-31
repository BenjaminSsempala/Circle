import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { completeOnboarding } from '@/lib/services/artists';

// POST — mark onboarding_complete = true (Step 4)
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  const result = await completeOnboarding(user.id);
  if (!result.ok) return err(result.error, 500);

  return ok({ ok: true });
}
