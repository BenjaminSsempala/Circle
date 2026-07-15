// Inspiration_Service — reads real, active packages from OTHER artists for the
// "see how other artists do it" surfaces. Art-form-weighted then shuffled.
// The ordering/mapping/fallback logic is pure and exported for testing; only
// getPackageInspiration touches the database (read-only).
// Feature: package-inspiration-templates

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/axiom/server';
import { artFormMatches, getLabel, getTemplateGroup } from '@/lib/data/art-forms';
import { getTemplatesForGroup, type PackageTemplate } from '@/lib/data/package-templates';

export interface InspirationCard {
  packageId: string;
  artistId: string; // internal — used for exclusion and matching
  artistName: string;
  artistSlug: string;
  artForm: string; // source artist's primary art-form label (via getLabel)
  sourceArtForms: string[]; // internal — raw stored values for art-form weighting
  packageName: string;
  duration: string | null;
  price: number;
  currency: string;
  description: string | null;
}

// Shape of a joined row returned by the read query. The `artists` relation may come back
// as an object (to-one) or, defensively, as a single-element array.
export interface InspirationRow {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number | string;
  currency: string | null;
  artist_id: string;
  artists:
    | { slug: string; display_name: string | null; art_forms: string[] | null }
    | { slug: string; display_name: string | null; art_forms: string[] | null }[]
    | null;
}

const DEFAULT_LIMIT = 24;
const CANDIDATE_CAP = 200;

// Fisher–Yates in-place shuffle using Math.random.
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// True when a card's source art forms include one matching the given art-form value.
export function cardMatchesArtForm(card: InspirationCard, artForm: string): boolean {
  return card.sourceArtForms.some((f) => artFormMatches(f, artForm));
}

// Map a joined DB row to an InspirationCard.
export function mapToInspirationCard(row: InspirationRow): InspirationCard {
  const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
  const artForms = artist?.art_forms ?? [];
  return {
    packageId: row.id,
    artistId: row.artist_id,
    artistName: artist?.display_name ?? '',
    artistSlug: artist?.slug ?? '',
    artForm: getLabel(artForms[0] ?? ''),
    sourceArtForms: artForms,
    packageName: row.name,
    duration: row.duration ?? null,
    price: typeof row.price === 'string' ? Number(row.price) : row.price,
    currency: row.currency ?? 'UGX',
    description: row.description ?? null,
  };
}

// Pure ordering: art-form matches first (each partition independently shuffled), then
// sliced to the limit. Exclusion of the current artist is applied by the query, but we
// also filter defensively here so the pure function honors it too.
export function orderInspiration(
  cards: InspirationCard[],
  artForm: string | null,
  limit: number,
  excludeArtistId?: string,
): InspirationCard[] {
  const pool = excludeArtistId ? cards.filter((c) => c.artistId !== excludeArtistId) : cards.slice();

  const matches: InspirationCard[] = [];
  const others: InspirationCard[] = [];
  for (const card of pool) {
    if (artForm && cardMatchesArtForm(card, artForm)) matches.push(card);
    else others.push(card);
  }

  shuffle(matches);
  shuffle(others);
  return matches.concat(others).slice(0, limit);
}

// Fallback resolution: below the inline threshold (including zero), show templates for the
// artist's group; otherwise show the cards.
export type InspirationDisplay =
  | { kind: 'cards'; cards: InspirationCard[] }
  | { kind: 'templates'; templates: PackageTemplate[] };

export function resolveInspirationDisplay(
  cards: InspirationCard[],
  artFormValue: string | null | undefined,
  threshold: number,
): InspirationDisplay {
  if (cards.length < threshold) {
    return { kind: 'templates', templates: getTemplatesForGroup(getTemplateGroup(artFormValue)) };
  }
  return { kind: 'cards', cards };
}

// DB wrapper (read-only). Returns [] on any error so callers can apply the template fallback.
export async function getPackageInspiration(opts: {
  excludeArtistId: string;
  artForm: string | null;
  limit?: number;
}): Promise<InspirationCard[]> {
  const { excludeArtistId, artForm, limit = DEFAULT_LIMIT } = opts;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('packages')
      .select('id, name, description, duration, price, currency, artist_id, artists!inner(slug, display_name, art_forms)')
      .eq('is_active', true)
      .neq('artist_id', excludeArtistId)
      .limit(CANDIDATE_CAP);

    if (error) {
      logger.error('Failed to read package inspiration', { error: error.message, excludeArtistId });
      return [];
    }

    const cards = (data ?? []).map((row) => mapToInspirationCard(row as unknown as InspirationRow));
    return orderInspiration(cards, artForm, limit, excludeArtistId);
  } catch (e) {
    logger.error('Unexpected error reading package inspiration', {
      error: e instanceof Error ? e.message : String(e),
      excludeArtistId,
    });
    return [];
  }
}
