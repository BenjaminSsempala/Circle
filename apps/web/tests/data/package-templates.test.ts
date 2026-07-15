import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  TEMPLATE_LIBRARY,
  getTemplatesForGroup,
  getTemplatesForArtForm,
  getTemplateById,
} from '@/lib/data/package-templates';
import type { TemplateGroup } from '@/lib/data/art-forms';

const ALL_GROUPS: TemplateGroup[] = [
  'musician',
  'poet',
  'visual',
  'dancer',
  'videographer',
  'actor',
  'author',
  'story-teller',
  'generic',
];

// ─── Property 1: Template data invariant ─────────────────────────────────────
// Feature: package-inspiration-templates, Property 1: For any PackageTemplate in the
// library, price is the empty string, productType ∈ {service, digital, merchandise},
// and contractRequired equals the product-type rule (service → true, else false).
describe('Property 1: template data invariant', () => {
  it('holds for every template', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TEMPLATE_LIBRARY), (tpl) => {
        expect(tpl.price).toBe('');
        expect(['service', 'digital', 'merchandise']).toContain(tpl.productType);
        expect(tpl.contractRequired).toBe(tpl.productType === 'service');
      }),
      { numRuns: 100 },
    );
  });

  it('every template uses at least one bracketed placeholder (Req 1.7)', () => {
    for (const tpl of TEMPLATE_LIBRARY) {
      expect(tpl.description).toMatch(/\[[^\]]+\]/);
    }
  });

  it('template ids are unique', () => {
    const ids = TEMPLATE_LIBRARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Coverage (Req 1.2, 1.3) ─────────────────────────────────────────────────
describe('template coverage', () => {
  it('every template group has at least one template', () => {
    for (const g of ALL_GROUPS) {
      expect(getTemplatesForGroup(g).length).toBeGreaterThan(0);
    }
  });

  it('there is at least one generic template', () => {
    expect(getTemplatesForGroup('generic').length).toBeGreaterThan(0);
  });

  it('getTemplatesForArtForm always returns a non-empty list', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constant(''), fc.constant(null), fc.constant(undefined)), (input) => {
        expect(getTemplatesForArtForm(input).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('getTemplateById resolves known ids and returns undefined for unknown', () => {
    expect(getTemplateById('generic-session')?.id).toBe('generic-session');
    expect(getTemplateById('does-not-exist')).toBeUndefined();
  });
});
