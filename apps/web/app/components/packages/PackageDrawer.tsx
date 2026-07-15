'use client';

import { useState, useEffect, useRef } from 'react';
import { getTemplatesForArtForm, type PackageTemplate } from '@/lib/data/package-templates';
import { templateToFormState, type PackageFormState } from '@/lib/packages/prefill';

type ProductType = 'service' | 'digital' | 'merchandise';

export type Package = {
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

type FormState = PackageFormState;

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

export function PackageDrawer({
  editing,
  onClose,
  artistSlug,
  artForm,
  prefill,
  initialTemplatePickerOpen,
  onSaved,
}: {
  editing: Package | null;
  onClose: () => void;
  artistSlug: string;
  artForm: string | null;
  prefill: FormState | null;
  initialTemplatePickerOpen: boolean;
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
      : { ...EMPTY_FORM, ...(prefill ?? {}) },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isCreate = editing === null;
  const templates = isCreate ? getTemplatesForArtForm(artForm) : [];
  const [pickerOpen, setPickerOpen] = useState(isCreate && initialTemplatePickerOpen);

  // ── Accessibility: focus management & Escape key ──────────────────────────
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save the element that had focus before the drawer opened so we can restore it on close.
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Move initial focus to the close button so screen readers announce the dialog.
    closeButtonRef.current?.focus();

    // Escape key closes the drawer.
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();

      // Trap focus inside the drawer.
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when the drawer unmounts.
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  function update(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyTemplate(t: PackageTemplate) {
    setForm((f) => ({ ...f, ...templateToFormState(t) }));
    setPickerOpen(false);
  }

  async function handleSave() {
    // Issue 2: validate description too, since the API requires it.
    if (!form.name.trim() || !form.price || !form.description.trim()) {
      setError('Name, price, and description are required.');
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
        duration: form.productType === 'service' ? form.duration : '',
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />

      {/* Issue 4: dialog semantics, focus trap ref, aria-modal */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit Package' : 'Add Package'}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <h2 id="drawer-title" className="text-headline-md font-headline-md text-on-surface">
            {editing ? 'Edit Package' : 'Add Package'}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Start from a template (create mode only) */}
          {isCreate && templates.length > 0 && (
            <div className="border border-outline-variant/40 rounded-xl overflow-hidden">
              <button
                type="button"
                aria-expanded={pickerOpen}
                aria-controls="template-picker"
                onClick={() => setPickerOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">
                  Start from a template
                </span>
                <span className="text-on-surface-variant text-sm" aria-hidden="true">{pickerOpen ? '▲' : '▼'}</span>
              </button>
              {pickerOpen && (
                <div id="template-picker" className="p-3 flex flex-col gap-2 bg-surface">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="text-left rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-on-surface">{t.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">{t.duration}</span>
                      </div>
                      <p className="text-caption font-caption text-on-surface-variant line-clamp-2 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking type — fieldset for grouped radio-like buttons */}
          <fieldset>
            <legend className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Booking type</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['service', 'digital', 'merchandise'] as ProductType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  role="radio"
                  aria-checked={form.productType === pt}
                  onClick={() => {
                    update('productType', pt);
                    if (pt === 'digital') { update('contractRequired', false); update('duration', ''); }
                    if (pt === 'service') { update('contractRequired', true); }
                    if (pt === 'merchandise') { update('contractRequired', false); update('duration', ''); }
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
          </fieldset>

          {/* Name */}
          <div>
            <label htmlFor="pkg-name" className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">
              Package name <span className="text-error" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="pkg-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Solo Performance"
              className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pkg-description" className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">
              Description <span className="text-error" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <textarea
              id="pkg-description"
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
              <label htmlFor="pkg-price" className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">
                Price <span className="text-error" aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="pkg-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="0"
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="pkg-currency" className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Currency</label>
              <select
                id="pkg-currency"
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

          {/* Duration — services only */}
          {form.productType === 'service' && (
            <div>
              <label htmlFor="pkg-duration" className="block text-label-mono font-label-mono text-on-surface text-sm mb-1.5">Duration</label>
              <input
                id="pkg-duration"
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                placeholder="e.g. 2 Hours, Half day"
                className="w-full border border-outline-variant/40 rounded-lg px-3 py-2.5 text-body-md font-body-md text-on-surface bg-surface focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Logistics toggle */}
          <div>
            <p id="logistics-label" className="text-label-mono font-label-mono text-on-surface text-sm mb-2">Logistics</p>
            <button
              type="button"
              aria-labelledby="logistics-label"
              aria-pressed={form.logisticsInclusive}
              onClick={() => update('logisticsInclusive', !form.logisticsInclusive)}
              className={`flex items-center gap-3 w-full border rounded-xl p-4 transition-colors ${
                form.logisticsInclusive ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/40 bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${form.logisticsInclusive ? 'bg-primary/15' : 'bg-error/10'}`}>
                {form.logisticsInclusive ? (
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <div className={`ml-auto w-10 h-6 rounded-full transition-colors shrink-0 ${form.logisticsInclusive ? 'bg-primary' : 'bg-outline-variant'}`} aria-hidden="true">
                <span className={`block w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${form.logisticsInclusive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Auto-accept */}
          <div>
            <p id="autoacept-label" className="text-label-mono font-label-mono text-on-surface text-sm mb-2">Booking acceptance</p>
            <button
              type="button"
              aria-labelledby="autoacept-label"
              aria-pressed={form.autoAccept}
              onClick={() => update('autoAccept', !form.autoAccept)}
              className={`flex items-center gap-3 w-full border rounded-xl p-4 transition-colors ${
                form.autoAccept ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/40 bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${form.autoAccept ? 'bg-primary/15' : 'bg-surface-container'}`}>
                <svg className={`w-4 h-4 ${form.autoAccept ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-label-mono font-label-mono text-on-surface text-sm font-semibold">Auto-accept bookings</p>
                <p className="text-caption font-caption text-on-surface-variant">
                  {form.autoAccept ? 'Booking accepted instantly' : 'You manually review each request'}
                </p>
              </div>
              <div className={`ml-auto w-10 h-6 rounded-full transition-colors shrink-0 ${form.autoAccept ? 'bg-primary' : 'bg-outline-variant'}`} aria-hidden="true">
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
