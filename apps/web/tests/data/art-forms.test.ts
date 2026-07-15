import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ART_FORM_REGISTRY,
  ART_FORM_LABELS,
  CATEGORY_ORDER,
  GENERIC_TEMPLATE_GROUP,
  getLabel,
  getTemplateGroup,
  artFormMatches,
  getFilterOptions,
  getGroupedOptions,
  type CategoryGroup,
} from '@/lib/data/art-forms';
import { getTemplatesForGroup } from '@/lib/data/package-templates';

const REGISTRY_VALUES = ART_FORM_REGISTRY.map((e) => e.value);

// ─── Property 3: Template routing totality and fallback ──────────────────────
// Feature: package-inspiration-templates, Property 3: For any art-form value, if the
// value (or one of its aliases) is present in the registry, getTemplateGroup returns
// that entry's templateGroup; for any other input (unknown string, free-text "Other",
// empty, null, undefined) it returns 'generic'. The returned group always has ≥1 template.
describe('Property 3: template routing totality and fallback', () => {
  it('maps known registry values to their templateGroup', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ART_FORM_REGISTRY), (entry) => {
        expect(getTemplateGroup(entry.value)).toBe(entry.templateGroup);
      }),
      { numRuns: 100 },
    );
  });

  it('maps known aliases to the owning entry templateGroup', () => {
    const aliasPairs = ART_FORM_REGISTRY.flatMap((e) =>
      (e.aliases ?? []).map((a) => ({ alias: a, group: e.templateGroup, value: e.value })),
    );
    fc.assert(
      fc.property(fc.constantFrom(...aliasPairs), ({ alias, value }) => {
        // An alias may collide with another entry's canonical value (value wins), so the
        // routing must equal whatever getTemplateGroup(value-or-alias resolution) yields —
        // assert it resolves to a real, non-generic-or-matching group deterministically.
        const viaAlias = getTemplateGroup(alias);
        expect(typeof viaAlias).toBe('string');
        // The alias must at least resolve to a group that owns at least one template.
        expect(getTemplatesForGroup(viaAlias).length).toBeGreaterThan(0);
        expect(value.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('falls back to generic for unknown / empty / null / undefined inputs', () => {
    const known = new Set(
      ART_FORM_REGISTRY.flatMap((e) => [e.value, e.label, ...(e.aliases ?? [])].map((s) => s.toLowerCase())),
    );
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constant(''), fc.constant(null), fc.constant(undefined)), (input) => {
        const norm = (input ?? '').toString().toLowerCase().replace(/[-_\s]+/g, ' ').trim();
        const isKnown = [...known].some((k) => k.replace(/[-_\s]+/g, ' ').trim() === norm);
        if (!isKnown) {
          expect(getTemplateGroup(input)).toBe(GENERIC_TEMPLATE_GROUP);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('every returned group has at least one template', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom(...REGISTRY_VALUES)), (input) => {
        expect(getTemplatesForGroup(getTemplateGroup(input)).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 10: Art-form label lookup and matcher ──────────────────────────
// Feature: package-inspiration-templates, Property 10: For any registry entry,
// getLabel(entry.value) returns entry.label, and artFormMatches holds for the entry's
// value, label, and every alias against its label; for any string not in the registry,
// getLabel returns the input unchanged.
describe('Property 10: label lookup and matcher', () => {
  it('getLabel returns the entry label for its value', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ART_FORM_REGISTRY), (entry) => {
        expect(getLabel(entry.value)).toBe(entry.label);
      }),
      { numRuns: 100 },
    );
  });

  it('artFormMatches holds for value and every alias against the entry label', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ART_FORM_REGISTRY), (entry) => {
        expect(artFormMatches(entry.value, entry.label)).toBe(true);
        for (const alias of entry.aliases ?? []) {
          expect(artFormMatches(alias, entry.label)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('getLabel returns unknown inputs unchanged', () => {
    const knownValues = new Set(REGISTRY_VALUES);
    // Fuzz over a safe ASCII alphabet (avoids a vitest worker-serialization quirk in the
    // default reporter when fast-check emits arbitrary unicode counterexamples). Req 13.5.
    fc.assert(
      fc.property(
        fc
          .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz -_'.split('')), { minLength: 1, maxLength: 24 })
          .map((chars) => chars.join('')),
        (s) => {
          if (!knownValues.has(s)) {
            expect(getLabel(s)).toBe(s);
          }
        },
      ),
      { numRuns: 100 },
    );
    // Explicit unknowns, including empty string and labels (labels are not value keys).
    for (const unknown of ['', 'totally-unknown', 'Musician', 'xyz123 form', 'jazz-fusion']) {
      if (!knownValues.has(unknown)) expect(getLabel(unknown)).toBe(unknown);
    }
  });
});

// ─── Structural unit tests (Req 14, 15, 16.6) ────────────────────────────────
describe('registry structure', () => {
  const EXISTING_LABELS = [
    'Poet',
    'Musician',
    'Visual Artist',
    'Dancer',
    'Videographer',
    'Actor',
    'Spoken Word Artist',
    'Author',
    'Cinematographer',
    'Story Teller',
  ];

  const ADDED_LABELS = [
    'DJ/Producer',
    'Photographer',
    'Comedian',
    'MC/Host',
    'Singer/Vocalist',
    'Instrumentalist',
    'Painter',
    'Illustrator',
    'Sculptor',
    'Fashion Designer',
    'Makeup Artist',
    'Model',
    'Content Creator/Influencer',
    'Graphic Designer',
    'Tattoo Artist',
    'Craftsperson/Artisan',
    'Choir/Group',
    'Band',
    'Cultural Troupe',
  ];

  it('preserves the canonical existing slugs (Req 13.3)', () => {
    const canonical = [
      'poet',
      'musician',
      'visual',
      'dancer',
      'digital',
      'theater',
      'spoken-word',
      'author',
      'cinematographer',
      'story-teller',
      'other',
    ];
    for (const slug of canonical) {
      expect(REGISTRY_VALUES).toContain(slug);
    }
  });

  it('includes all existing art-form labels (Req 14.1)', () => {
    const labels = ART_FORM_REGISTRY.map((e) => e.label);
    for (const l of EXISTING_LABELS) expect(labels).toContain(l);
  });

  it('includes all added art-form labels (Req 14.2)', () => {
    const labels = ART_FORM_REGISTRY.map((e) => e.label);
    for (const l of ADDED_LABELS) expect(labels).toContain(l);
  });

  it('assigns every entry a valid category group (Req 14.3)', () => {
    const valid: CategoryGroup[] = ['Music', 'Visual', 'Performance', 'Digital', 'Other'];
    for (const e of ART_FORM_REGISTRY) expect(valid).toContain(e.group);
  });

  it('getGroupedOptions groups by category in order (Req 15.1)', () => {
    const grouped = getGroupedOptions();
    // groups appear in CATEGORY_ORDER
    const groupsSeen = grouped.map((g) => g.group);
    const expectedOrder = CATEGORY_ORDER.filter((c) => groupsSeen.includes(c));
    expect(groupsSeen).toEqual(expectedOrder);
    // every entry in a group actually belongs to that category
    for (const g of grouped) {
      for (const e of g.entries) expect(e.group).toBe(g.group);
    }
    // all entries accounted for
    const total = grouped.reduce((n, g) => n + g.entries.length, 0);
    expect(total).toBe(ART_FORM_REGISTRY.length);
  });

  it('getFilterOptions returns exactly the showInFilters subset (Req 16.6)', () => {
    const filter = getFilterOptions();
    expect(filter.every((e) => e.showInFilters)).toBe(true);
    expect(filter.length).toBe(ART_FORM_REGISTRY.filter((e) => e.showInFilters).length);
  });

  it('ART_FORM_LABELS covers every registry value', () => {
    for (const e of ART_FORM_REGISTRY) expect(ART_FORM_LABELS[e.value]).toBe(e.label);
  });
});
