import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

function redirect(from: NextResponse, url: URL) {
  const r = NextResponse.redirect(url);
  from.headers.getSetCookie().forEach((c) => r.headers.append('set-cookie', c));
  return r;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const isAuthPage = path.startsWith('/auth/login') || path.startsWith('/auth/signup');
  // /discover is always public — guests can browse
  const requiresAuth = ['/dashboard', '/onboarding', '/saved', '/bookings', '/my-circle', '/booking'].some(p => path.startsWith(p));
  const artistOnlyPaths = ['/dashboard', '/onboarding/artist'];
  const audiencePaths = ['/saved', '/bookings']; // /discover is open to artists (browse-only)

  // Not logged in trying to hit auth-required route
  if (!user && requiresAuth) {
    url.pathname = '/auth/login';
    return redirect(supabaseResponse, url);
  }

  if (user) {
    // Cache the role in a short-lived cookie to avoid a DB query on every request
    const ROLE_COOKIE = '__circle_role';
    const ROLE_TTL    = 120; // seconds
    let role: string | undefined = request.cookies.get(ROLE_COOKIE)?.value;

    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      role = profile?.role ?? undefined;
      if (role) supabaseResponse.cookies.set(ROLE_COOKIE, role, {
        maxAge: ROLE_TTL, httpOnly: true, sameSite: 'strict', path: '/',
      });
    }

    // Logged-in user hitting auth pages
    if (isAuthPage) {
      // Allow staying on signup if no role yet (role selection step)
      if (!role && path.startsWith('/auth/signup')) return supabaseResponse;
      url.pathname = role === 'audience' ? '/my-circle' : '/dashboard';
      return redirect(supabaseResponse, url);
    }

    // Artist hitting audience-only routes → dashboard
    if (role === 'artist' && audiencePaths.some(p => path.startsWith(p))) {
      url.pathname = '/dashboard';
      return redirect(supabaseResponse, url);
    }

    // Audience hitting artist-only routes → my-circle
    if (role === 'audience' && artistOnlyPaths.some(p => path.startsWith(p))) {
      url.pathname = '/my-circle';
      return redirect(supabaseResponse, url);
    }
  }

  return supabaseResponse;
}
