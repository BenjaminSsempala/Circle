import { createClient } from '@supabase/supabase-js';

// Service-role client for trusted server-side code (e.g. the booking state
// machine and contract pipeline). These callers perform their own
// authorization checks before reading/writing, so RLS is bypassed here.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Next.js patches global fetch with its caching layer, which can hang
      // repeated requests in route handlers — force no-store to bypass it.
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    },
  );
}
