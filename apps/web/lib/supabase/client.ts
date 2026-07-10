import { createBrowserClient } from '@supabase/ssr';

// Called in client components ('use client').
// Returns null during SSR/build when env vars are absent — callers must handle this.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null as never;
  return createBrowserClient(url, key);
}
