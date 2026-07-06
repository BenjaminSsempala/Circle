export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger, withAxiom } from '@/lib/axiom/server';

// GET /api/auth/confirm
// Handles email confirmation from Supabase email link
// Supabase sends: ?code=... (pkce code)
// This exchanges the code for a session, then redirects to role selection
export const GET = withAxiom(async (request: NextRequest) => {
  const context = { endpoint: '/api/auth/confirm', method: 'GET' };
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Email confirmation error
  if (error) {
    logger.warn('Email confirmation rejected by provider', { ...context, authError: error });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    logger.warn('Email confirmation rejected: Missing verification code', { ...context });
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
  
  // Exchange code for session (same as OAuth callback)
  logger.info('Exchanging email confirmation code for user session', { ...context });
  const { data: { session }, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !session) {
    logger.error('Email confirmation token exchange failed', { 
      ...context, 
      error: exchangeError?.message ?? 'Session generation failed' 
    });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message ?? 'unknown')}`,
    );
  }

  // Email is now confirmed: check profile status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', session.user.id)
    .single();

  if (profileError) {
    logger.error('Profile fetch failed during email confirmation routing', { 
      ...context, 
      userId: session.user.id, 
      error: profileError.message 
    });
  }

  // Determine redirect destination
  let redirectPath = '/auth/signup?step=role'; // Default: no role yet

  if (profile?.role && profile?.onboarding_complete) {
    // Already fully onboarded
    redirectPath = profile.role === 'audience' ? '/discover' : '/dashboard';
  } else if (profile?.role && !profile?.onboarding_complete) {
    redirectPath = profile.role === 'audience' ? '/discover' : '/onboarding/artist';
  }

  logger.info('Email confirmed and user routing evaluated', {
    ...context,
    userId: session.user.id,
    hasRole: !!profile?.role,
    role: profile?.role ?? null,
    onboardingComplete: profile?.onboarding_complete ?? false,
    destination: redirectPath
  });

  // Create response and ensure session cookies are included
  const response = NextResponse.redirect(`${origin}${redirectPath}`);

  // Set cookies with their original options (preserving httpOnly: false for the client SDK)
  cookiesToSetList.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
});