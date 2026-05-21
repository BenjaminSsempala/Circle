import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { signOut } from '@/lib/services/auth';
import { createClient } from '@/lib/supabase/server';

// POST /api/auth/logout
// Called by: web app, Flutter app
export async function POST() {
  await signOut();
  return ok({ loggedOut: true });
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
    ? profile?.role === 'organiser'
      ? '/onboarding/organiser'
      : '/onboarding/artist'
    : profile?.role === 'organiser'
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
