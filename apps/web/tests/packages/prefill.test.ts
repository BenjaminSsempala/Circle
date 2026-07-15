import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  templateToFormState,
  packageToFormState,
  resolvePackagePrefill,
  type PackageRow,
} from '@/lib/packages/prefill';
import { TEMPLATE_LIBRARY, getTemplateById } from '@/lib/data/package-templates';

// ─── Property 2: Prefill mapping fidelity ────────────────────────────────────
// Feature: package-inspiration-templates, Property 2: For any PackageTemplate,
// templateToFormState produces a form whose productType/contractRequired/autoAccept equal
// the template's, and whose price is the empty string.
describe('Property 2: prefill mapping fidelity', () => {
  it('holds for every template', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TEMPLATE_LIBRARY), (tpl) => {
        const form = templateToFormState(tpl);
        expect(form.price).toBe('');
        expect(form.productType).toBe(tpl.productType);
        expect(form.contractRequired).toBe(tpl.contractRequired);
        expect(form.autoAccept).toBe(tpl.autoAccept);
        expect(form.name).toBe(tpl.name);
        expect(form.description).toBe(tpl.description);
        expect(form.duration).toBe(tpl.duration);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 9: Prefill resolution precedence and validity ──────────────────
// Feature: package-inspiration-templates, Property 9: When a valid template id is present,
// resolvePackagePrefill returns source 'template' regardless of any example; when only a
// resolvable example is present it returns source 'example'; when neither id resolves it
// returns null.
describe('Property 9: prefill resolution precedence and validity', () => {
  const templateIds = TEMPLATE_LIBRARY.map((t) => t.id);
  const KNOWN_EXAMPLE_ID = 'example-123';

  const exampleRow: PackageRow = {
    id: KNOWN_EXAMPLE_ID,
    name: 'Peer package',
    description: 'A real package from another artist',
    price: 250000,
    currency: 'UGX',
    duration: '2 hours',
    logistics_inclusive: true,
    product_type: 'service',
    auto_accept: false,
    contract_required: true,
  };

  const fetchExample = async (id: string): Promise<PackageRow | null> =>
    id === KNOWN_EXAMPLE_ID ? exampleRow : null;

  it('template wins over example when the template id resolves', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...templateIds),
        fc.constantFrom(KNOWN_EXAMPLE_ID, 'missing', ''),
        async (template, example) => {
          const result = await resolvePackagePrefill({ template, example, fetchExample });
          expect(result?.source).toBe('template');
          expect(result?.form.price).toBe('');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('resolves example when template is absent/invalid and example resolves', () => {
    fc.assert(
      fc.asyncProperty(fc.constantFrom(null, '', 'not-a-template'), async (template) => {
        const result = await resolvePackagePrefill({ template, example: KNOWN_EXAMPLE_ID, fetchExample });
        expect(result?.source).toBe('example');
        expect(result?.form.name).toBe('Peer package');
      }),
      { numRuns: 100 },
    );
  });

  it('returns null when neither id resolves', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(null, '', 'not-a-template'),
        fc.constantFrom(null, '', 'no-such-example'),
        async (template, example) => {
          const result = await resolvePackagePrefill({ template, example, fetchExample });
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('a valid but unknown template id falls through to example', async () => {
    // guards against accidentally treating any non-empty template string as valid
    expect(getTemplateById('definitely-not-real')).toBeUndefined();
    const result = await resolvePackagePrefill({
      template: 'definitely-not-real',
      example: KNOWN_EXAMPLE_ID,
      fetchExample,
    });
    expect(result?.source).toBe('example');
  });
});

// ─── packageToFormState example mapping ──────────────────────────────────────
describe('packageToFormState', () => {
  it('carries price across as a string and copies fields', () => {
    const row: PackageRow = {
      id: 'p1',
      name: 'Gig',
      description: null,
      price: 500000,
      currency: 'KES',
      duration: null,
      logistics_inclusive: true,
      product_type: 'digital',
      auto_accept: true,
      contract_required: false,
    };
    const form = packageToFormState(row);
    expect(form.price).toBe('500000');
    expect(form.description).toBe('');
    expect(form.duration).toBe('');
    expect(form.currency).toBe('KES');
    expect(form.productType).toBe('digital');
    expect(form.autoAccept).toBe(true);
    expect(form.contractRequired).toBe(false);
  });
});
