export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { ok, err } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug')?.trim();

  if (!slug) return err('slug is required');
  if (!/^[a-z0-9-]+$/.test(slug)) return ok({ available: false, reason: 'Invalid characters' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from('artists')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  return ok({ available: !data });
}
