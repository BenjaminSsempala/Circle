import { ok, err } from '@/lib/api';
import { getArtistBySlug } from '@/lib/services/artists';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const result = await getArtistBySlug(params.slug);
  if (!result.ok) return err(result.error, 404);
  return ok({ artist: result.artist, packages: result.packages });
}
