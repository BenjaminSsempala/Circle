export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger, withAxiom } from '@/lib/axiom/server';

// GET /api/auth/confirm
// Handles email confirmation from Supabase email link.
// Supabase sends: ?code=... (PKCE code)
// This exchanges the code for a session to verify the email, then signs the
// user back out and redirects them to the login page with ?confirmed=true.
// The login page shows a "✓ Email confirmed!" banner when that param is present.
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
          });
        },
      },
    },
  );

  // Exchange code for session — this is what marks the email as confirmed in Supabase.
  logger.info('Exchanging email confirmation code for user session', { ...context });
  const { data: { session }, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !session) {
    logger.error('Email confirmation token exchange failed', {
      ...context,
      error: exchangeError?.message ?? 'Session generation failed',
    });
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError?.message ?? 'unknown')}`,
    );
  }

  logger.info('Email confirmed — signing out and redirecting to login', {
    ...context,
    userId: session.user.id,
  });

  // Sign the user out — confirmation is a verification step only.
  // The user must log in explicitly. The login page shows a
  // "✓ Email confirmed!" banner when ?confirmed=true is present.
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/auth/login?confirmed=true`);
});
