import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/axiom/server', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { createClient } from '@/lib/supabase/server';
import {
  orderInspiration,
  mapToInspirationCard,
  resolveInspirationDisplay,
  getPackageInspiration,
  type InspirationCard,
  type InspirationRow,
} from '@/lib/services/inspiration';
import { getTemplatesForGroup } from '@/lib/data/package-templates';

const mockCreateClient = createClient as unknown as ReturnType<typeof vi.fn>;

// Arbitrary for InspirationCard with a controllable art form and artist id.
const cardArb = (): fc.Arbitrary<InspirationCard> =>
  fc.record({
    packageId: fc.uuid(),
    artistId: fc.constantFrom('a1', 'a2', 'a3', 'a4', 'self'),
    artistName: fc.constantFrom('Ama', 'Kofi', 'Zola', 'Neo'),
    artistSlug: fc.constantFrom('ama', 'kofi', 'zola', 'neo'),
    artForm: fc.constantFrom('Musician', 'Poet', 'Dancer', 'Visual Artist'),
    sourceArtForms: fc.subarray(['musician', 'poet', 'dancer', 'visual', 'theater'], { minLength: 0, maxLength: 3 }),
    packageName: fc.constantFrom('Set', 'Show', 'Session'),
    duration: fc.option(fc.constantFrom('1 hour', '2 hours'), { nil: null }),
    price: fc.integer({ min: 0, max: 1_000_000 }),
    currency: fc.constantFrom('UGX', 'KES'),
    description: fc.option(fc.constantFrom('desc'), { nil: null }),
  });

// ─── Property 4: excludes the current artist ─────────────────────────────────
// Feature: package-inspiration-templates, Property 4: For any candidate set and any
// excludeArtistId, orderInspiration returns no card whose artistId equals excludeArtistId.
describe('Property 4: inspiration excludes the current artist', () => {
  it('never returns the excluded artist', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb(), { maxLength: 40 }),
        fc.constantFrom('a1', 'a2', 'a3', 'a4', 'self'),
        fc.option(fc.constantFrom('musician', 'poet', 'dancer', 'visual'), { nil: null }),
        fc.integer({ min: 0, max: 30 }),
        (cards, exclude, artForm, limit) => {
          const out = orderInspiration(cards, artForm, limit, exclude);
          expect(out.every((c) => c.artistId !== exclude)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 5: art-form matches first ──────────────────────────────────────
// Feature: package-inspiration-templates, Property 5: For any candidate set and art-form
// value, every matching card appears before every non-matching card in the output.
describe('Property 5: inspiration orders art-form matches first', () => {
  it('no non-match precedes a match', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb(), { maxLength: 40 }),
        fc.constantFrom('musician', 'poet', 'dancer', 'visual'),
        fc.integer({ min: 0, max: 40 }),
        (cards, artForm, limit) => {
          const out = orderInspiration(cards, artForm, limit);
          const matchFlags = out.map((c) => c.sourceArtForms.some((f) => f === artForm || matchesLoose(f, artForm)));
          // once we see a non-match, there must be no match afterwards
          let seenNonMatch = false;
          let orderViolated = false;
          for (const isMatch of matchFlags) {
            if (!isMatch) seenNonMatch = true;
            else if (seenNonMatch) { orderViolated = true; break; }
          }
          expect(orderViolated).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('at least one match appears first when matches exist', () => {
    // Construct cards where at least one matches the art form; the first output
    // card must be a match.
    const matchingCard: InspirationCard = {
      packageId: 'p-match',
      artistId: 'a1',
      artistName: 'Ama',
      artistSlug: 'ama',
      artForm: 'Musician',
      sourceArtForms: ['musician'],
      packageName: 'Set',
      duration: '1 hour',
      price: 100000,
      currency: 'UGX',
      description: null,
    };
    const nonMatchingCard: InspirationCard = {
      ...matchingCard,
      packageId: 'p-other',
      artistId: 'a2',
      sourceArtForms: ['poet'],
    };
    const out = orderInspiration([nonMatchingCard, matchingCard], 'musician', 10);
    expect(out.length).toBe(2);
    // The matching card must appear before the non-matching one.
    const matchIdx = out.findIndex((c) => c.packageId === 'p-match');
    const nonMatchIdx = out.findIndex((c) => c.packageId === 'p-other');
    expect(matchIdx).toBeLessThan(nonMatchIdx);
  });
});

// loose matcher mirroring artFormMatches for the simple slug cases used in the arbitrary
function matchesLoose(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// ─── Property 6: shuffle preserves contents and count ────────────────────────
// Feature: package-inspiration-templates, Property 6: For any candidate set and limit, the
// output length is min(pool.length, limit) and every output card came from the input.
describe('Property 6: inspiration shuffle preserves contents and count', () => {
  it('output is a subset of the input with the right length', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb(), { maxLength: 40 }),
        fc.option(fc.constantFrom('musician', 'poet'), { nil: null }),
        fc.integer({ min: 0, max: 50 }),
        (cards, artForm, limit) => {
          // no exclusion here so the whole pool is eligible
          const out = orderInspiration(cards, artForm, limit);
          expect(out.length).toBe(Math.min(cards.length, limit));
          const inputIds = new Set(cards.map((c) => c.packageId));
          expect(out.every((c) => inputIds.has(c.packageId))).toBe(true);
          // no duplicates introduced
          expect(new Set(out.map((c) => c.packageId)).size).toBe(out.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 7: card mapping completeness ───────────────────────────────────
// Feature: package-inspiration-templates, Property 7: For any joined row, mapToInspirationCard
// produces a card with packageId, artistName, artistSlug, artForm, packageName, price, currency.
describe('Property 7: inspiration card mapping completeness', () => {
  it('maps required fields', () => {
    const rowArb: fc.Arbitrary<InspirationRow> = fc.record({
      id: fc.uuid(),
      name: fc.constantFrom('Set', 'Gig'),
      description: fc.option(fc.constantFrom('d'), { nil: null }),
      duration: fc.option(fc.constantFrom('1 hour'), { nil: null }),
      price: fc.oneof(fc.integer({ min: 0, max: 999999 }), fc.constantFrom('1000', '5000')),
      currency: fc.option(fc.constantFrom('UGX', 'KES'), { nil: null }),
      artist_id: fc.uuid(),
      artists: fc.record({
        slug: fc.constantFrom('ama', 'kofi'),
        display_name: fc.option(fc.constantFrom('Ama', 'Kofi'), { nil: null }),
        art_forms: fc.subarray(['musician', 'poet', 'visual'], { minLength: 0, maxLength: 2 }),
      }),
    });
    fc.assert(
      fc.property(rowArb, (row) => {
        const card = mapToInspirationCard(row);
        expect(card.packageId).toBe(row.id);
        expect(typeof card.artistName).toBe('string');
        expect(typeof card.artistSlug).toBe('string');
        expect(typeof card.artForm).toBe('string');
        expect(card.packageName).toBe(row.name);
        expect(typeof card.price).toBe('number');
        expect(Number.isNaN(card.price)).toBe(false);
        expect(typeof card.currency).toBe('string');
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 8: fallback to templates below threshold ───────────────────────
// Feature: package-inspiration-templates, Property 8: For any card list below the threshold
// (including zero) and any art form, the resolved display is that group's templates, non-empty.
describe('Property 8: fallback to templates below threshold', () => {
  it('returns non-empty templates when below threshold', () => {
    fc.assert(
      fc.property(
        fc.array(cardArb(), { maxLength: 10 }),
        fc.option(fc.constantFrom('musician', 'poet', 'dancer', 'visual', 'unknown-form'), { nil: null }),
        fc.integer({ min: 1, max: 12 }),
        (cards, artForm, threshold) => {
          const display = resolveInspirationDisplay(cards, artForm, threshold);
          if (cards.length < threshold) {
            expect(display.kind).toBe('templates');
            if (display.kind === 'templates') {
              expect(display.templates.length).toBeGreaterThan(0);
            }
          } else {
            expect(display.kind).toBe('cards');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty card list always yields templates', () => {
    const display = resolveInspirationDisplay([], 'musician', 3);
    expect(display.kind).toBe('templates');
    if (display.kind === 'templates') {
      expect(display.templates).toEqual(getTemplatesForGroup('musician'));
    }
  });

  it('at threshold boundary yields cards, not templates', () => {
    // cards.length === threshold → cards.length is NOT < threshold → should be 'cards'
    const cards: InspirationCard[] = Array.from({ length: 3 }, (_, i) => ({
      packageId: `p${i}`,
      artistId: `a${i}`,
      artistName: 'Artist',
      artistSlug: 'artist',
      artForm: 'Musician',
      sourceArtForms: ['musician'],
      packageName: 'Set',
      duration: null,
      price: 0,
      currency: 'UGX',
      description: null,
    }));
    const display = resolveInspirationDisplay(cards, 'musician', 3);
    expect(display.kind).toBe('cards');
    if (display.kind === 'cards') {
      expect(display.cards).toBe(cards);
    }
  });
});

// ─── getPackageInspiration read query (mocked supabase) ──────────────────────
describe('getPackageInspiration read query', () => {
  beforeEach(() => vi.clearAllMocks());

  // Build a chainable mock that supports .contains() in addition to the existing chain.
  function makeClient(result: { data: unknown; error: unknown }) {
    const limit = vi.fn().mockResolvedValue(result);
    const contains = vi.fn(() => ({ limit }));
    const neq = vi.fn(() => ({ limit, contains }));
    const eq = vi.fn(() => ({ neq }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    return { client: { from }, spies: { from, select, eq, neq, limit, contains } };
  }

  const sampleRow = {
    id: 'p1',
    name: 'Live Set',
    description: 'd',
    duration: '1 hour',
    price: 300000,
    currency: 'UGX',
    artist_id: 'other-1',
    product_type: 'service',
    logistics_inclusive: false,
    auto_accept: false,
    contract_required: true,
    artists: { slug: 'ama', display_name: 'Ama', art_forms: ['musician'] },
  };

  it('filters is_active and excludes the current artist, returns mapped cards', async () => {
    const { client, spies } = makeClient({ data: [sampleRow], error: null });
    mockCreateClient.mockResolvedValue(client);

    const out = await getPackageInspiration({ excludeArtistId: 'self', artForm: 'musician', limit: 10 });

    expect(spies.eq).toHaveBeenCalledWith('is_active', true);
    expect(spies.neq).toHaveBeenCalledWith('artist_id', 'self');
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out[0].artistSlug).toBe('ama');
    expect(out[0].artForm).toBe('Musician');
    expect(out[0].productType).toBe('service');
    expect(out[0].logisticsInclusive).toBe(false);
    expect(out[0].contractRequired).toBe(true);
  });

  it('returns [] on a query error', async () => {
    const { client } = makeClient({ data: null, error: { message: 'boom' } });
    mockCreateClient.mockResolvedValue(client);
    const out = await getPackageInspiration({ excludeArtistId: 'self', artForm: null });
    expect(out).toEqual([]);
  });

  it('returns [] when the client throws', async () => {
    mockCreateClient.mockRejectedValue(new Error('no cookies'));
    const out = await getPackageInspiration({ excludeArtistId: 'self', artForm: null });
    expect(out).toEqual([]);
  });
});
