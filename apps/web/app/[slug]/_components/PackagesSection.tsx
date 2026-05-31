'use client';

import { useState } from 'react';

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: string | null;
  logistics_inclusive: boolean;
};

type PackageFormData = {
  name: string;
  description: string;
  price: string;
  duration: string;
  logisticsInclusive: boolean;
};

const BLANK_FORM: PackageFormData = {
  name: '', description: '', price: '', duration: '1 hour', logisticsInclusive: false,
};

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

function PackageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PackageFormData;
  onSave: (data: PackageFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof PackageFormData, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary/20 p-md flex flex-col gap-3 bg-surface-container-lowest">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Package Name *</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Signature Performance" className="w-full" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Price (UGX) *</label>
          <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className="w-full" required />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Duration</label>
          <select value={form.duration} onChange={(e) => set('duration', e.target.value)} className="w-full">
            {['30 min', '1 hour', '2 hours', '4 hours', 'Full Day', 'Per Piece', 'Negotiable'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">What&apos;s included *</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full resize-none" placeholder="e.g. Sound system, Stage setup, 2 Revisions" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Logistics</label>
        <button
          type="button"
          onClick={() => set('logisticsInclusive', !form.logisticsInclusive)}
          className="flex items-center gap-3 rounded-lg border border-outline-variant/40 px-3 py-2.5 hover:border-primary/40 transition-colors text-left"
        >
          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${form.logisticsInclusive ? 'bg-primary/10' : 'bg-error/10'}`}>
            {form.logisticsInclusive ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </span>
          <span className="text-sm text-on-surface">Transport</span>
          <span className="ml-auto text-xs text-on-surface-variant">{form.logisticsInclusive ? 'Included' : 'Not included'}</span>
        </button>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || !form.name || !form.price} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save package'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReadonlyCard({ pkg, featured, isOwner, onEdit, onDelete }: {
  pkg: Package; featured: boolean; isOwner: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`rounded-xl border p-md flex flex-col gap-sm shadow-sm bg-surface-container-lowest relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 ${featured ? 'border-primary/20' : 'border-outline-variant'}`}>
      {featured && <div className="absolute top-0 right-0 w-16 h-16 bg-tertiary/5 rounded-bl-full -z-10" />}

      <div className="flex justify-between items-start gap-2">
        <h4 className="text-body-lg font-body-lg font-semibold text-primary leading-snug">{pkg.name}</h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {pkg.duration && (
            <span className={`text-label-mono font-label-mono px-2 py-1 rounded text-xs ${featured ? 'text-secondary bg-secondary/10' : 'text-on-surface-variant bg-surface-variant'}`}>
              {pkg.duration}
            </span>
          )}
          {isOwner && (
            <>
              <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button onClick={onDelete} className="text-xs text-error font-semibold px-2 py-1 rounded bg-error/10 hover:bg-error/20 transition-colors">Delete</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-on-surface-variant hover:text-primary transition-colors px-1">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} title="Delete" className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/5 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="text-headline-md font-headline-md text-on-surface">
        {formatPrice(pkg.price, pkg.currency)}{' '}
        {pkg.duration && <span className="text-body-md font-body-md text-on-surface-variant font-normal">/ {pkg.duration.toLowerCase()}</span>}
      </div>

      {pkg.description && <p className="text-body-md font-body-md text-on-surface-variant">{pkg.description}</p>}

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Logistics</p>
        <div className="flex items-center gap-2 text-body-md font-body-md text-on-surface">
          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${pkg.logistics_inclusive ? 'bg-primary/10' : 'bg-error/10'}`}>
            {pkg.logistics_inclusive ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </span>
          <span>Transport</span>
          <span className="text-on-surface-variant text-xs ml-1">{pkg.logistics_inclusive ? 'Included' : 'Not included'}</span>
        </div>
      </div>

      <button className={`mt-auto w-full py-2 px-4 rounded-lg text-label-mono font-label-mono transition-colors flex justify-center items-center gap-xs ${featured ? 'bg-secondary text-white hover:bg-on-secondary-container shadow-sm' : 'bg-transparent border border-primary text-primary hover:bg-primary/5'}`}>
        Book Now
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

export function PackagesSection({ packages: initial, isOwner }: { packages: Package[]; isOwner: boolean }) {
  const [packages, setPackages] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const handleAdd = async (form: PackageFormData) => {
    const res = await fetch('/api/artists/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: 'UGX',
        duration: form.duration,
        logisticsInclusive: form.logisticsInclusive,
      }),
    });
    const { package: pkg } = await res.json();
    if (pkg) setPackages((prev) => [...prev, pkg]);
    setAddingNew(false);
  };

  const handleUpdate = async (id: string, form: PackageFormData) => {
    const res = await fetch(`/api/packages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: 'UGX',
        duration: form.duration,
        logisticsInclusive: form.logisticsInclusive,
      }),
    });
    const { package: pkg } = await res.json();
    if (pkg) setPackages((prev) => prev.map((p) => (p.id === id ? pkg : p)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-md">
      {(packages.length > 0 || isOwner) && (
        <div className="flex items-center justify-between">
          <h3 className="text-headline-md font-headline-md text-primary">Booking Packages</h3>
          {isOwner && !addingNew && (
            <button onClick={() => setAddingNew(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add package
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-sm">
        {packages.map((pkg, i) =>
          editingId === pkg.id ? (
            <PackageForm
              key={pkg.id}
              initial={{ name: pkg.name, description: pkg.description ?? '', price: String(pkg.price), duration: pkg.duration ?? '1 hour', logisticsInclusive: pkg.logistics_inclusive }}
              onSave={(form) => handleUpdate(pkg.id, form)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ReadonlyCard
              key={pkg.id}
              pkg={pkg}
              featured={i === 0}
              isOwner={isOwner}
              onEdit={() => setEditingId(pkg.id)}
              onDelete={() => handleDelete(pkg.id)}
            />
          )
        )}

        {addingNew && (
          <PackageForm initial={BLANK_FORM} onSave={handleAdd} onCancel={() => setAddingNew(false)} />
        )}

        {packages.length === 0 && !isOwner && (
          <div className="rounded-xl border border-outline-variant/30 p-md text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">No packages listed yet.</p>
          </div>
        )}

        {packages.length === 0 && isOwner && !addingNew && (
          <button onClick={() => setAddingNew(true)} className="rounded-xl border border-dashed border-outline-variant p-md flex flex-col items-center gap-2 hover:border-primary hover:text-primary text-on-surface-variant transition-colors">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm font-medium">Add your first package</span>
          </button>
        )}
      </div>
    </div>
  );
}
