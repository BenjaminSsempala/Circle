// Pure prefill mappers + resolver for the add-package form.
// Shared by the dashboard packages server page (resolves ?template / ?example) and the
// client PackageDrawer (seeds create-mode form state). No DB access here — the example
// fetch is injected so this module stays pure and testable.
// Feature: package-inspiration-templates

import type { PackageTemplate } from '@/lib/data/package-templates';
import { getTemplateById } from '@/lib/data/package-templates';

export type ProductType = 'service' | 'digital' | 'merchandise';

// Mirrors PackageDrawer's FormState.
export interface PackageFormState {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
  logisticsInclusive: boolean;
  productType: ProductType;
  autoAccept: boolean;
  contractRequired: boolean;
}

export interface PackagePrefill {
  source: 'template' | 'example';
  form: PackageFormState;
}

// A package row as read from the DB (snake_case columns) for the "example" path.
export interface PackageRow {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string | null;
  duration: string | null;
  logistics_inclusive?: boolean | null;
  product_type?: ProductType | null;
  auto_accept?: boolean | null;
  contract_required?: boolean | null;
}

const DEFAULT_CURRENCY = 'UGX';

// Template → form. Price is always left empty (Req 8.5); productType / contractRequired /
// autoAccept are copied from the template (Req 2.4).
export function templateToFormState(t: PackageTemplate): PackageFormState {
  return {
    name: t.name,
    description: t.description,
    price: '',
    currency: DEFAULT_CURRENCY,
    duration: t.duration,
    logisticsInclusive: false,
    productType: t.productType,
    autoAccept: t.autoAccept,
    contractRequired: t.contractRequired,
  };
}

// Example package row → form. Price is carried across as a string for the numeric input.
export function packageToFormState(p: PackageRow): PackageFormState {
  return {
    name: p.name,
    description: p.description ?? '',
    price: String(p.price ?? ''),
    currency: p.currency ?? DEFAULT_CURRENCY,
    duration: p.duration ?? '',
    logisticsInclusive: p.logistics_inclusive ?? false,
    productType: p.product_type ?? 'service',
    autoAccept: p.auto_accept ?? false,
    contractRequired: p.contract_required ?? p.product_type !== 'merchandise',
  };
}

// Resolve prefill from URL params. Template wins over example when both are present and
// the template id resolves (Req 8.9). Returns null when neither id resolves (Req 8.6).
// `fetchExample` is injected so this function is DB-agnostic and unit-testable.
export async function resolvePackagePrefill(args: {
  template?: string | null;
  example?: string | null;
  fetchExample: (packageId: string) => Promise<PackageRow | null>;
}): Promise<PackagePrefill | null> {
  const { template, example, fetchExample } = args;

  if (template) {
    const tpl = getTemplateById(template);
    if (tpl) {
      return { source: 'template', form: templateToFormState(tpl) };
    }
  }

  if (example) {
    const row = await fetchExample(example);
    if (row) {
      return { source: 'example', form: packageToFormState(row) };
    }
  }

  return null;
}
