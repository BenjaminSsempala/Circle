export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signOut } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/logout
export async function POST() {
  await signOut();
  return ok({ loggedOut: true });
}

// PATCH /api/auth/me — update occasion_type
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return err('Not authenticated', 401);

  const body = await req.json().catch(() => null);
  if (!body) return err('Invalid JSON', 400);

  const allowed = ['occasion_type', 'full_name'];
  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) return err('No valid fields', 400);

  const { error: updateError } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id);

  if (updateError) return err(updateError.message, 500);
  return ok({ ok: true });
}

// GET /api/auth/me
// Returns the current user's profile and redirect target
// Called by: Flutter app on launch to check auth state
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return err('Not authenticated', 401);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single();

  const redirectTo = !profile?.onboarding_complete
    ? profile?.role === 'audience'
      ? '/discover'
      : '/onboarding/artist'
    : profile?.role === 'audience'
      ? '/discover'
      : '/dashboard';

  return ok({
    userId:             user.id,
    email:              user.email,
    role:               profile?.role,
    onboardingComplete: profile?.onboarding_complete,
    redirectTo,
  });
}
