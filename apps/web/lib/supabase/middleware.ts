import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isProtected = ['/dashboard', '/onboarding', '/discover'].some(p =>
    url.pathname.startsWith(p),
  );
  const isAuthPage = ['/auth/login', '/auth/signup'].some(p =>
    url.pathname.startsWith(p),
  );

  // Not logged in, trying to hit a protected route → login
  if (!user && isProtected) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Already logged in, hitting auth pages → redirect to their home
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    url.pathname = profile?.role === 'organiser' ? '/discover' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
