export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supabase redirects to /api/auth/callback after Google OAuth
// This route exchanges the code for a session then sends the
// user to the right place based on their role / onboarding state.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  // OAuth error (user cancelled, etc.)
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data: { user }, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !user) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message ?? 'unknown')}`,
    );
  }

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single();

  // No profile or no role yet → role selection first.
  // The DB trigger creates a profile row with role = null on signup,
  // so we must check for null role explicitly, not just missing profile.
  if (!profile || !profile.role) {
    return NextResponse.redirect(`${origin}/auth/signup?step=role`);
  }

  if (!profile.onboarding_complete) {
    const dest = profile.role === 'audience' ? '/discover' : '/onboarding/artist';
    return NextResponse.redirect(`${origin}${dest}`);
  }

  const home = profile.role === 'audience' ? '/discover' : '/dashboard';
  return NextResponse.redirect(`${origin}${home}`);
}
