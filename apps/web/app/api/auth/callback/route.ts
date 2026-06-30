export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

  const {
    data: { session, user },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !session || !user) {
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
  let redirectPath = '/auth/signup?step=role';

  if (profile?.role) {
    if (!profile.onboarding_complete) {
      redirectPath = profile.role === 'audience' ? '/discover' : '/onboarding/artist';
    } else {
      redirectPath = profile.role === 'audience' ? '/discover' : '/dashboard';
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  cookiesToSetList.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
