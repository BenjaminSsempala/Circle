import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Refresh token is missing or invalid — clear the session
      supabaseResponse.cookies.delete('sb-access-token');
      supabaseResponse.cookies.delete('sb-refresh-token');
      // Also clear the project-scoped SSR auth token
      const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (projectRef) {
        supabaseResponse.cookies.delete(`sb-${projectRef}-auth-token`);
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    // Unexpected exception — also clear session as precaution
    supabaseResponse.cookies.delete('sb-access-token');
    supabaseResponse.cookies.delete('sb-refresh-token');
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectRef) {
      supabaseResponse.cookies.delete(`sb-${projectRef}-auth-token`);
    }
  }

  const url = request.nextUrl.clone();
  const path = url.pathname;

  const isAuthPage = path.startsWith('/auth/login') || path.startsWith('/auth/signup');
  const requiresAuth = ['/dashboard', '/onboarding', '/saved', '/bookings', '/my-circle', '/booking'].some(p => path.startsWith(p));

  // Not logged in trying to hit auth-required route → send to login
  if (!user && requiresAuth) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch role fresh each time
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    const role = profile?.role;

    // Logged-in user hitting auth pages → redirect to dashboard/my-circle
    if (isAuthPage) {
      if (!role && path.startsWith('/auth/signup')) {
        return supabaseResponse; // Still in signup flow, let them through
      }
      url.pathname = role === 'audience' ? '/my-circle' : '/dashboard';
      return NextResponse.redirect(url);
    }

    // Artist hitting audience-only routes → dashboard
    if (role === 'artist' && ['/saved', '/bookings'].some(p => path.startsWith(p))) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Audience hitting artist-only routes → my-circle
    if (role === 'audience' && ['/dashboard', '/onboarding/artist'].some(p => path.startsWith(p))) {
      url.pathname = '/my-circle';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}