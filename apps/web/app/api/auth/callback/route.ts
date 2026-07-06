export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { logger, withAxiom } from '@/lib/axiom/server';

// Supabase redirects to /api/auth/callback after Google OAuth
// This route exchanges the code for a session then sends the
// user to the right place based on their role / onboarding state.
export const GET = withAxiom(async (request: NextRequest) => {
  const context = { endpoint: '/api/auth/callback', method: 'GET' };
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  // OAuth error (user cancelled, etc.)
  if (error) {
    logger.warn('OAuth callback rejected by provider', { ...context, oauthError: error });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    logger.warn('OAuth callback rejected: Missing exchange code', { ...context });
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const cookiesToSetList: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            cookiesToSetList.push({ name, value, options });
          });
        },
      },
    },
  );

  logger.info('Exchanging OAuth code for user session', { ...context });
  const {
    data: { session, user },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !session || !user) {
    logger.error('OAuth code exchange failed', { 
      ...context, 
      error: exchangeError?.message ?? 'Session or user missing' 
    });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message ?? 'unknown')}`,
    );
  }

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single();

  if (profileError) {
    logger.error('Profile fetch failed during OAuth routing', { 
      ...context, 
      userId: user.id, 
      error: profileError.message 
    });
  }

  // No profile or no role yet → role selection first.
  let redirectPath = '/auth/signup?step=role';

  if (profile?.role) {
    if (!profile.onboarding_complete) {
      redirectPath = profile.role === 'audience' ? '/discover' : '/onboarding/artist';
    } else {
      redirectPath = profile.role === 'audience' ? '/discover' : '/dashboard';
    }
  }

  logger.info('OAuth user routing evaluation successful', {
    ...context,
    userId: user.id,
    hasRole: !!profile?.role,
    role: profile?.role ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
    destination: redirectPath
  });

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  cookiesToSetList.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
});