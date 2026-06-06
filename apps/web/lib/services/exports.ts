import { createClient as createAnonClient } from '@supabase/supabase-js';

function getAnon() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type ExportPackage = {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number;
  currency: string;
  tier: string;
  logistics_inclusive: boolean;
};

export type ExportWork = {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url: string;
  provider: string;
  type: string;
};

export type ExportData = {
  artist: Record<string, unknown>;
  packages: ExportPackage[];
  works: ExportWork[];
  socialLinks: Record<string, string>;
};

export async function getExportData(slug: string): Promise<ExportData | null> {
  const { data: artist } = await getAnon()
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!artist) return null;

  const { data: packages } = await getAnon()
    .from('packages')
    .select('*')
    .eq('artist_id', artist.id)
    .eq('is_active', true)
    .order('tier', { ascending: true })
    .order('created_at', { ascending: true });

  const works: ExportWork[] = Array.isArray(artist.selected_works)
    ? (artist.selected_works as ExportWork[]).slice(0, 3)
    : [];

  const socialLinks =
    artist.social_links && typeof artist.social_links === 'object'
      ? (artist.social_links as Record<string, string>)
      : {};

  return {
    artist,
    packages: (packages ?? []) as ExportPackage[],
    works,
    socialLinks,
  };
}
