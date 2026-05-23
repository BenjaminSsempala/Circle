import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  // 1. Create the initial downstream response object
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
          // Sync changes cleanly back to the incoming request stream
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // 2. SAFE FIX: Write all cookies onto the existing response instance 
          // WITHOUT overwriting the whole object inside the loop
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh session token state securely
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isProtected = ['/dashboard', '/onboarding', '/discover'].some(p =>
    url.pathname.startsWith(p),
  );
  const isAuthPage = ['/auth/login', '/auth/signup'].some(p =>
    url.pathname.startsWith(p),
  );

  // Not logged in, trying to hit a protected route → redirect to login
  if (!user && isProtected) {
    url.pathname = '/auth/login';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.headers.getSetCookie().forEach((cookieStr) => {
      redirectResponse.headers.append('set-cookie', cookieStr);
    });
    return redirectResponse;
  }

  // Already logged in, hitting auth pages → redirect to their home dashboard
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role') // Pull the role to check if they need to finish the signup step
      .eq('id', user.id)
      .single();

    // =================================================================
    // THE FIX: Allow logged-in users to stay on signup IF they have no role
    // =================================================================
    if (!profile?.role && url.pathname.startsWith('/auth/signup')) {
      return supabaseResponse; // Let them stay on the page to pick a role!
    }

    // Otherwise, they have a role, so redirect them away from auth pages
    url.pathname = profile?.role === 'organiser' ? '/discover' : '/dashboard';

    // 3. CRITICAL NOTE FOR REDIRECTS:
    // If you return a completely new redirect object, your newly refreshed session cookies are lost!
    // We must pass the updated response cookies into the redirect response context explicitly.
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.headers.getSetCookie().forEach((cookieStr) => {
      redirectResponse.headers.append('set-cookie', cookieStr);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}