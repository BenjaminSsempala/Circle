import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/auth/confirm
// Handles email confirmation from Supabase email link
// Supabase sends: ?code=... (pkce code)
// This exchanges the code for a session, then redirects to role selection
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Email confirmation error
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
  
  // Exchange code for session (same as OAuth callback)
  const { data: { session }, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !session) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message ?? 'unknown')}`,
    );
  }

  // Email is now confirmed — check profile status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', session.user.id)
    .single();

  // Determine redirect destination
  let redirectPath = '/auth/signup?step=role'; // Default: no role yet

  if (profile?.role && profile?.onboarding_complete) {
    // Already fully onboarded
    redirectPath = profile.role === 'organiser' ? '/discover' : '/dashboard';
  } else if (profile?.role && !profile?.onboarding_complete) {
    // Has role but not onboarded yet
    redirectPath =
      profile.role === 'organiser'
        ? '/onboarding/organiser'
        : '/onboarding/artist';
  }

  // Create response and ensure session cookies are included
  const response = NextResponse.redirect(`${origin}${redirectPath}`);

  // Manually set session cookies in response to ensure browser receives them
  cookieStore.getAll().forEach(({ name, value }) => {
    // Set both auth cookies if they start with 'sb-'
    if (name.startsWith('sb-')) {
      response.cookies.set(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }
  });

  return response;
}
