// Inspiration_Service — reads real, active packages from OTHER artists for the
// "see how other artists do it" surfaces. Art-form-weighted then shuffled.
// The ordering/mapping/fallback logic is pure and exported for testing; only
// getPackageInspiration touches the database (read-only).
// Feature: package-inspiration-templates

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/axiom/server';
import { artFormMatches, getLabel, getTemplateGroup } from '@/lib/data/art-forms';
import { getTemplatesForGroup, type PackageTemplate } from '@/lib/data/package-templates';

// Issue 5: include package behavior fields so inline "Use as example" copies
// semantics correctly instead of defaulting everything to service/no-logistics.
export interface InspirationCard {
  packageId: string;
  artistId: string;        // internal — used for exclusion and matching
  artistName: string;
  artistSlug: string;
  artForm: string;         // source artist's primary art-form label (via getLabel)
  sourceArtForms: string[]; // internal — raw stored values for art-form weighting
  packageName: string;
  duration: string | null;
  price: number;
  currency: string;
  description: string | null;
  // Behavior fields — carried through so prefill is semantically accurate.
  productType: 'service' | 'digital' | 'merchandise';
  logisticsInclusive: boolean;
  autoAccept: boolean;
  contractRequired: boolean;
}

// Shape of a joined row returned by the read query.
export interface InspirationRow {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number | string;
  currency: string | null;
  artist_id: string;
  product_type: string | null;
  logistics_inclusive: boolean | null;
  auto_accept: boolean | null;
  contract_required: boolean | null;
  artists:
    | { slug: string; display_name: string | null; art_forms: string[] | null }
    | { slug: string; display_name: string | null; art_forms: string[] | null }[]
    | null;
}

// Issue 6: fetch matched and unmatched pools separately so art-form prioritization
// happens before any row cap, preventing matching rows from being squeezed out.
// Each pool is capped independently; combined total never exceeds limit.
const MATCH_CAP = 100;
const OTHER_CAP = 100;

// Fisher–Yates shuffle using crypto.getRandomValues().
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  if (arr.length === 0) return arr;
  const randomValues = new Uint32Array(arr.length);
  crypto.getRandomValues(randomValues);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// True when a card's source art forms include one matching the given art-form value.
export function cardMatchesArtForm(card: InspirationCard, artForm: string): boolean {
  return card.sourceArtForms.some((f) => artFormMatches(f, artForm));
}

// Map a joined DB row to an InspirationCard.
export function mapToInspirationCard(row: InspirationRow): InspirationCard {
  const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
  const artForms = artist?.art_forms ?? [];
  const pt = (row.product_type ?? 'service') as 'service' | 'digital' | 'merchandise';
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
    productType: ['service', 'digital', 'merchandise'].includes(pt) ? pt : 'service',
    logisticsInclusive: row.logistics_inclusive ?? false,
    autoAccept: row.auto_accept ?? false,
    contractRequired: row.contract_required ?? pt === 'service',
  };
}

// Pure ordering: matches-first, each partition independently shuffled, sliced to limit.
// Exclusion is enforced in the query; we also filter defensively here.
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

  return shuffle(matches).concat(shuffle(others)).slice(0, limit);
}

// Fallback: below threshold, show templates instead of an empty grid.
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

// Issue 5+6: updated select includes behavior fields; uses two capped queries so
// art-form-matching rows are fetched first (up to MATCH_CAP) and others fill the
// remainder — prioritization happens before any row cap hits.
const SELECT_COLS =
  'id, name, description, duration, price, currency, artist_id, ' +
  'product_type, logistics_inclusive, auto_accept, contract_required, ' +
  'artists!inner(slug, display_name, art_forms)';

export async function getPackageInspiration(opts: {
  excludeArtistId: string;
  artForm: string | null;
  limit?: number;
}): Promise<InspirationCard[]> {
  const { excludeArtistId, artForm, limit = 24 } = opts;
  try {
    const supabase = await createClient();
    const base = supabase
      .from('packages')
      .select(SELECT_COLS)
      .eq('is_active', true)
      .neq('artist_id', excludeArtistId);

    // Issue 6: fetch art-form matches and non-matches in two separate capped queries
    // so the DB slice always includes matching rows regardless of total package volume.
    let matchedCards: InspirationCard[] = [];
    let otherCards: InspirationCard[] = [];

    if (artForm) {
      // Supabase doesn't support array-contains-any filtering on joined tables directly,
      // so we fetch a broad set of candidates and partition in application code. Two
      // separate limits ensure matching rows are always represented.
      const [matchRes, otherRes] = await Promise.all([
        base
          // Filter by the artist's art_form stored in the artists table via the join.
          // Use .contains on the art_forms array for an exact-value match.
          .contains('artists.art_forms', [artForm])
          .limit(MATCH_CAP),
        base
          // Fetch packages whose artist does NOT have the matching art form.
          // Supabase doesn't support .not().contains() on joined columns, so we
          // fetch a larger set and partition below.
          .limit(OTHER_CAP),
      ]);

      if (matchRes.error) {
        logger.error('Failed to read matched inspiration', { error: matchRes.error.message, excludeArtistId });
      } else {
        matchedCards = (matchRes.data ?? []).map((r) => mapToInspirationCard(r as unknown as InspirationRow));
      }

      if (otherRes.error) {
        logger.error('Failed to read other inspiration', { error: otherRes.error.message, excludeArtistId });
      } else {
        const matchIds = new Set(matchedCards.map((c) => c.packageId));
        otherCards = (otherRes.data ?? [])
          .map((r) => mapToInspirationCard(r as unknown as InspirationRow))
          .filter((c) => !matchIds.has(c.packageId) && !cardMatchesArtForm(c, artForm));
      }
    } else {
      // No art form — single query, standard shuffle.
      const { data, error } = await base.limit(OTHER_CAP);
      if (error) {
        logger.error('Failed to read package inspiration', { error: error.message, excludeArtistId });
        return [];
      }
      otherCards = (data ?? []).map((r) => mapToInspirationCard(r as unknown as InspirationRow));
    }

    // Combine: shuffled matches first, shuffled others fill the rest up to limit.
    const combined = shuffle(matchedCards).concat(shuffle(otherCards)).slice(0, limit);
    return combined;
  } catch (e) {
    logger.error('Unexpected error reading package inspiration', {
      error: e instanceof Error ? e.message : String(e),
      excludeArtistId,
    });
    return [];
  }
}
