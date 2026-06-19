export const dynamic = 'force-dynamic';

import { createClient as createAnonClient } from '@supabase/supabase-js';
import { ok, err } from '@/lib/api';

function getAnon() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const anon = getAnon();

  const { data: artist } = await anon
    .from('artists')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!artist) return err('Artist not found', 404);

  const { data, error } = await anon
    .from('availability')
    .select('date, type')
    .eq('artist_id', artist.id)
    .gte('date', new Date().toISOString().slice(0, 10));

  if (error) return err(error.message, 500);

  const blackoutDates = (data ?? []).filter((d) => d.type === 'blackout').map((d) => d.date);
  const bookedDates = (data ?? []).filter((d) => d.type === 'booked').map((d) => d.date);

  return ok({ blackoutDates, bookedDates });
}
