import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Called in Server Components, Route Handlers, and middleware
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    },
  );
}

// ─── Auth helper for export routes ───────────────────────────────────────────

export async function requireArtistOwnership(slug: string) {
  const supabase = await createClient();
  
  let user = null;
  let authError = null;
  
  try {
    const result = await supabase.auth.getUser();
    user = result.data?.user ?? null;
    authError = result.error;
  } catch (error) {
    // Refresh token is missing or invalid
    authError = error as any;

  }

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 as const, artist: null };
  }

  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!artist) {
    return { error: 'Not found', status: 404 as const, artist: null };
  }

  if (artist.user_id !== user.id) {
    return { error: 'Forbidden', status: 403 as const, artist: null };
  }

  return { error: null, status: 200 as const, artist, user };
}
