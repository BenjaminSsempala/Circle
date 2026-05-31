import { createClient } from '@/lib/supabase/server';
import { ok, err } from '@/lib/api';
import { updateSocialLinks } from '@/lib/services/artists';

// PATCH — save social link URLs (Step 3)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return err('Unauthorized', 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body');
  }

  const { socialLinks } = body as { socialLinks?: Record<string, string> };

  const result = await updateSocialLinks(user.id, socialLinks ?? {});
  if (!result.ok) return err(result.error, 500);

  return ok({ ok: true });
}
