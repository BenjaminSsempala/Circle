import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { setUserRole } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/role
// Body: { role: 'artist' | 'organiser' }
// Auth: Bearer token required
// Called by: web signup page (role step), Flutter app
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.role || !['artist', 'organiser'].includes(body.role)) {
    return err('role must be "artist" or "organiser"', 422);
  }

  // Verify the session — user must be logged in to set their role
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return err('Unauthorised — please sign in first', 401);
  }

  const fullName = body.fullName || user.user_metadata?.full_name || '';

  const result = await setUserRole(user.id, body.role, fullName);
  if (!result.ok) return err(result.error, result.status);

  const redirectTo = body.role === 'organiser'
    ? '/onboarding/organiser'
    : '/onboarding/artist';

  return ok({ role: body.role, redirectTo }, 201);
}
