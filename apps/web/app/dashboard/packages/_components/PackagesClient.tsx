'use client';

import { useState } from 'react';
import Link from 'next/link';

type ProductType = 'service' | 'digital' | 'merchandise';

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: string | null;
  tier: string;
  logistics_inclusive: boolean;
  is_active: boolean;
  created_at: string;
  product_type: ProductType;
  auto_accept: boolean;
  contract_required: boolean;
};

type FormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
  logisticsInclusive: boolean;
  productType: ProductType;
  autoAccept: boolean;
  contractRequired: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  currency: 'UGX',
  duration: '',
  logisticsInclusive: false,
  productType: 'service',
  autoAccept: false,
  contractRequired: true,
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  service: 'Service',
  digital: 'Digital',
  merchandise: 'Merchandise',
};

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

function PackageCard({
  pkg,
  onEdit,
  onToggle,
  onDelete,
}: {
  pkg: Package;
  onEdit: (p: Package) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-surface border rounded-xl p-5 relative transition-all ${pkg.is_active ? 'border-outline-variant/30' : 'border-outline-variant/20 opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-on-surface-variant cursor-grab opacity-40">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onEdit(pkg)}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(pkg.id)}
                className="text-xs text-error font-semibold px-2 py-1 rounded hover:bg-error/10"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-on-surface-variant px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {/* Toggle */}
          <button
            onClick={() => onToggle(pkg.id, !pkg.is_active)}
            className={`relative w-11 h-6 rounded-full transition-colors ${pkg.is_active ? 'bg-primary' : 'bg-outline-variant'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${pkg.is_active ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h3 className="text-label-mono font-label-mono text-on-surface font-semibold">{pkg.name}</h3>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {PRODUCT_TYPE_LABELS[pkg.product_type ?? 'service']}
        </span>
        {pkg.auto_accept && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
            Auto-accept
          </span>
        )}
        {pkg.product_type !== 'merchandise' && !pkg.contract_required && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            No contract
          </span>
        )}
      </div>
      {pkg.description && (
        <p className="text-caption font-caption text-on-surface-variant mb-3 line-clamp-2">{pkg.description}</p>
      )}

      <div className="flex items-center gap-3 mb-3">
        {pkg.duration && (
          <span className="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs px-2.5 py-1 rounded-full">
            {pkg.duration}
          </span>
        )}
        <span className="text-label-mono font-label-mono text-on-surface font-bold text-sm">
          {formatPrice(pkg.price, pkg.currency)}
        </span>
      </div>

      {/* Logistics: only show when included */}
      {pkg.logistics_inclusive && (
        <div className="flex items-center gap-1.5 text-caption font-caption">
          <span className="text-primary">✓</span>
          <span className="text-on-surface-variant">Transport included</span>
        </div>
      )}
    </div>
  );
}

function PackageDrawer({
  editing,
  onClose,
  artistSlug,
  onSaved,
}: {
  editing: Package | null;
  onClose: () => void;
  artistSlug: string;
  onSaved: (pkg: Package) => void;
}) {
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          name: editing.name,
          description: editing.description ?? '',
          price: String(editing.price),
          currency: editing.currency,
          duration: editing.duration ?? '',
          logisticsInclusive: editing.logistics_inclusive,
          productType: editing.product_type ?? 'service',
          autoAccept: editing.auto_accept ?? false,
          contractRequired: editing.contract_required ?? true,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) {
      setError('Name and price are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: form.currency || 'UGX',
        duration: form.duration,
        logisticsInclusive: form.logisticsInclusive,
        productType: form.productType,
        autoAccept: form.autoAccept,
        contractRequired: form.productType === 'merchandise' ? false : form.contractRequired,
      };

      const res = editing
        ? await fetch(`/api/packages/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/artists/${artistSlug}/packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Save failed');
        return;
      }
      const d = await res.json();
      onSaved(d.package);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <h2 className="text-headline-md font-headline-md text-on-surface">
            {editing ? 'Edit Package' : 'Add Package'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Product type */}
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Booking type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['service', 'digital', 'merchandise'] as ProductType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => {
                    update('productType', pt);
                    if (pt === 'digital') update('contractRequired', false);
                    if (pt === 'service') update('contractRequired', true);
                    if (pt === 'merchandise') update('contractRequired', false);
                  }}
                  className={`text-sm font-semibold rounded-lg border px-3 py-2.5 transition-colors ${
                    form.productType === pt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  {PRODUCT_TYPE_LABELS[pt]}
                </button>
              ))}
            </div>
            <p className="text-caption font-caption text-on-surface-variant mt-1.5">
              {form.productType === 'service' && 'Live performances, workshops, sessions: contract always required.'}
              {form.productType === 'digital' && 'Birthday messages, custom videos, digital art: no contract needed by default.'}
              {form.productType === 'merchandise' && 'Physical goods: audience sees your contact card to arrange purchase.'}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">
              Package name <span className="text-error">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Solo Performance"
              className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="What's included in this package?"
              className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">
                Price <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="0"
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
              >
                {['UGX', 'USD', 'KES', 'GHS', 'ZAR', 'NGN'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Duration</label>
            <input
              value={form.duration}
              onChange={(e) => update('duration', e.target.value)}
              placeholder="e.g. 2 Hours, Half day"
              className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Logistics toggle */}
          <div>
            <p className="text-label-mono font-label-mono text-on-surface text-sm mb-2">Logistics</p>
            <button
              type="button"
              onClick={() => update('logisticsInclusive', !form.logisticsInclusive)}
              className={`flex items-center gap-3 w-full border rounded-xl p-4 transition-colors ${
                form.logisticsInclusive
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-outline-variant/40 bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${form.logisticsInclusive ? 'bg-primary/15' : 'bg-error/10'}`}>
                {form.logisticsInclusive ? (
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">Transport</p>
                <p className="text-caption font-caption text-on-surface-variant">
                  {form.logisticsInclusive ? 'Included in package' : 'Not included'}
                </p>
              </div>
              <div className={`ml-auto w-10 h-6 rounded-full transition-colors shrink-0 ${form.logisticsInclusive ? 'bg-primary' : 'bg-outline-variant'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.logisticsInclusive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Auto-accept */}
          <div>
            <p className="text-label-mono font-label-mono text-on-surface text-sm mb-2">Booking acceptance</p>
            <button
              type="button"
              onClick={() => update('autoAccept', !form.autoAccept)}
              className={`flex items-center gap-3 w-full border rounded-xl p-4 transition-colors ${
                form.autoAccept ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/40 bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${form.autoAccept ? 'bg-primary/15' : 'bg-surface-container'}`}>
                <svg className={`w-4 h-4 ${form.autoAccept ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">Auto-accept bookings</p>
                <p className="text-caption font-caption text-on-surface-variant">
                  {form.autoAccept ? 'Booking accepted instantly' : 'You manually review each request'}
                </p>
              </div>
              <div className={`ml-auto w-10 h-6 rounded-full transition-colors shrink-0 ${form.autoAccept ? 'bg-primary' : 'bg-outline-variant'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.autoAccept ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Contract required: hide for merchandise */}
          {form.productType !== 'merchandise' && (
            <div>
              <p className="text-label-mono font-label-mono text-on-surface text-sm mb-2">Contract</p>
              <button
                type="button"
                onClick={() => update('contractRequired', !form.contractRequired)}
                className={`flex items-center gap-3 w-full border rounded-xl p-4 transition-colors ${
                  form.contractRequired ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/40 bg-surface'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${form.contractRequired ? 'bg-primary/15' : 'bg-surface-container'}`}>
                  <svg className={`w-4 h-4 ${form.contractRequired ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">
                    {form.contractRequired ? 'Contract required' : 'No contract'}
                  </p>
                  <p className="text-caption font-caption text-on-surface-variant">
                    {form.contractRequired
                      ? 'Both parties sign before booking is locked in'
                      : 'Booking locks in immediately after acceptance'}
                  </p>
                </div>
                <div className={`ml-auto w-10 h-6 rounded-full transition-colors shrink-0 ${form.contractRequired ? 'bg-primary' : 'bg-outline-variant'}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.contractRequired ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          )}

          {error && <p className="text-error text-sm">{error}</p>}
        </div>

        <div className="p-6 border-t border-outline-variant/30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-on-primary font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add package'}
          </button>
        </div>
      </div>
    </>
  );
}

export function PackagesClient({
  initialPackages,
  artistSlug,
}: {
  initialPackages: Package[];
  artistSlug: string;
}) {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  function openAdd() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function handleSaved(pkg: Package) {
    setPackages((prev) => {
      const idx = prev.findIndex((p) => p.id === pkg.id);
      if (idx === -1) return [...prev, pkg];
      const next = [...prev];
      next[idx] = pkg;
      return next;
    });
    closeDrawer();
  }

  async function handleToggle(id: string, active: boolean) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: active } : p)));
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    await fetch(`/api/packages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pkg.name,
        description: pkg.description ?? '',
        price: pkg.price,
        currency: pkg.currency,
        duration: pkg.duration ?? '',
        logisticsInclusive: pkg.logistics_inclusive,
        is_active: active,
      }),
    });
  }

  async function handleDelete(id: string) {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/packages/${id}`, { method: 'DELETE' });
  }

  return (
    <>
      {/* Add button + rate card */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 border-dashed rounded-xl p-12 text-center">
          <p className="text-on-surface-variant text-body-md font-body-md mb-2">No packages yet.</p>
          <p className="text-caption font-caption text-on-surface-variant mb-4">
            Add your first package to start getting booked.
          </p>
          <button
            onClick={openAdd}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:opacity-90"
          >
            + Add package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Export rate card */}
      <div className="mt-8 pt-6 border-t border-outline-variant/20">
        <Link
          href={`/api/artists/${artistSlug}/export/rate-card`}
          className="inline-flex items-center gap-2 text-primary text-label-mono font-label-mono text-sm hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export rate card PDF
        </Link>
      </div>

      {/* Package drawer */}
      {drawerOpen && (
        <PackageDrawer
          editing={editing}
          onClose={closeDrawer}
          artistSlug={artistSlug}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
