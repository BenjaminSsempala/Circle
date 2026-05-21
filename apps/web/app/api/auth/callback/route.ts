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

  // No profile yet — this is a brand new Google signup.
  // The role wasn't set yet; redirect to role selection.
  if (!profile) {
    return NextResponse.redirect(`${origin}/auth/signup?step=role`);
  }

  // Profile exists but onboarding not done
  if (!profile.onboarding_complete) {
    const dest = profile.role === 'organiser'
      ? '/onboarding/organiser'
      : '/onboarding/artist';
    return NextResponse.redirect(`${origin}${dest}`);
  }

  // Fully onboarded — send to their home
  const home = profile.role === 'organiser' ? '/discover' : '/dashboard';
  return NextResponse.redirect(`${origin}${home}`);
}
