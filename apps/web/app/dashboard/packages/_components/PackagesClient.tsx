'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExportModal } from '@/app/[slug]/_components/ExportModal';
import { getTemplatesForArtForm, type PackageTemplate } from '@/lib/data/package-templates';
import { templateToFormState, type PackageFormState, type PackagePrefill } from '@/lib/packages/prefill';
import type { InspirationCard } from '@/lib/services/inspiration';
import { PackageDrawer, type Package } from '@/app/components/packages/PackageDrawer';

type FormState = PackageFormState;

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  service: 'Service',
  digital: 'Digital',
  merchandise: 'Merchandise',
};

const INLINE_MIN = 3;

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

// Map an in-memory inspiration card to form state for the "Use as example" preview action.
// Full-fidelity example prefill (with product type / logistics) happens server-side via the
// ?example= param; this in-memory path uses sensible defaults for the fields a card lacks.
function inspirationToForm(card: InspirationCard): FormState {
  return {
    name: card.packageName,
    description: card.description ?? '',
    price: String(card.price ?? ''),
    currency: card.currency ?? 'UGX',
    duration: card.duration ?? '',
    logisticsInclusive: card.logisticsInclusive,
    productType: card.productType,
    autoAccept: card.autoAccept,
    contractRequired: card.contractRequired,
  };
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

// Small preview card used in the empty-state inline inspiration preview.
function InspirationPreviewCard({ card, onUse }: { card: InspirationCard; onUse: () => void }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {card.artForm}
        </span>
        {card.artistSlug && (
          <Link href={`/${card.artistSlug}`} className="text-caption font-caption text-on-surface-variant hover:text-primary hover:underline">
            {card.artistName}
          </Link>
        )}
      </div>
      <h4 className="text-label-mono font-label-mono text-on-surface font-semibold">{card.packageName}</h4>
      {card.description && (
        <p className="text-caption font-caption text-on-surface-variant mt-1 line-clamp-2">{card.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2 mb-3">
        {card.duration && (
          <span className="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs px-2 py-0.5 rounded-full">
            {card.duration}
          </span>
        )}
        <span className="text-label-mono font-label-mono text-on-surface font-bold text-sm">
          {formatPrice(card.price, card.currency)}
        </span>
      </div>
      <button
        onClick={onUse}
        className="mt-auto min-h-[44px] text-sm font-semibold rounded-lg border border-primary/40 text-primary hover:bg-primary/5 transition-colors"
      >
        Use as example
      </button>
    </div>
  );
}

// Small preview card used when there aren't enough live examples (template fallback).
function TemplatePreviewCard({ tpl, onUse }: { tpl: PackageTemplate; onUse: () => void }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">
          Template
        </span>
      </div>
      <h4 className="text-label-mono font-label-mono text-on-surface font-semibold">{tpl.name}</h4>
      <p className="text-caption font-caption text-on-surface-variant mt-1 line-clamp-2">{tpl.description}</p>
      <div className="flex items-center gap-2 mt-2 mb-3">
        <span className="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs px-2 py-0.5 rounded-full">
          {tpl.duration}
        </span>
      </div>
      <button
        onClick={onUse}
        className="mt-auto min-h-[44px] text-sm font-semibold rounded-lg border border-primary/40 text-primary hover:bg-primary/5 transition-colors"
      >
        Use as template
      </button>
    </div>
  );
}

export function PackagesClient({
  initialPackages,
  artist,
  inspiration = [],
  initialPrefill = null,
  openDrawer = false,
}: {
  initialPackages: Package[];
  artist: any;
  inspiration?: InspirationCard[];
  initialPrefill?: PackagePrefill | null;
  openDrawer?: boolean;
}) {
  const artistSlug = artist.slug;
  const artForm: string | null = Array.isArray(artist.art_forms) ? artist.art_forms[0] ?? null : null;

  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(!!openDrawer);
  const [editing, setEditing] = useState<Package | null>(null);
  const [activePrefill, setActivePrefill] = useState<FormState | null>(initialPrefill?.form ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawerSeq, setDrawerSeq] = useState(0);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  function openAdd(opts?: { picker?: boolean; prefill?: FormState | null }) {
    setEditing(null);
    setActivePrefill(opts?.prefill ?? null);
    setPickerOpen(!!opts?.picker);
    setDrawerSeq((n) => n + 1);
    setDrawerOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setActivePrefill(null);
    setPickerOpen(false);
    setDrawerSeq((n) => n + 1);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setActivePrefill(null);
    setPickerOpen(false);
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

  const showInspirationFallback = inspiration.length < INLINE_MIN;
  const fallbackTemplates = getTemplatesForArtForm(artForm).slice(0, 3);
  const allTemplates = getTemplatesForArtForm(artForm);
  const previewCards = inspiration.slice(0, 3);
  const [templateGridOpen, setTemplateGridOpen] = useState(false);

  return (
    <>
      {/* Add button + rate card */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-surface border border-outline-variant/30 border-dashed rounded-xl p-8 md:p-12">
          <div className="text-center">
            <p className="text-on-surface-variant text-body-md font-body-md mb-2">No packages yet.</p>
            <p className="text-caption font-caption text-on-surface-variant mb-6">
              Add your first package to start getting booked.
            </p>

            {/* Two CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setTemplateGridOpen((o) => !o)}
                className="w-full sm:w-auto min-h-[44px] bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:opacity-90 flex items-center justify-center gap-2 transition-all"
              >
                Start with a template
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${templateGridOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <Link
                href="/dashboard/packages/inspiration"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center border border-outline-variant/50 text-on-surface px-5 py-2.5 rounded-xl text-label-mono font-label-mono font-semibold hover:bg-surface-container transition-colors"
              >
                See how other artists do it
              </Link>
            </div>
          </div>

          {/* Template grid — expands inline when "Start with a template" is clicked */}
          {templateGridOpen && (
            <div className="mt-2 mb-8">
              <p className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3 text-left">
                Choose a template to start from
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemplateGridOpen(false);
                      openAdd({ prefill: templateToFormState(t) });
                    }}
                    className="text-left rounded-xl border border-outline-variant/30 hover:border-primary hover:bg-primary/5 p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">{t.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">{t.duration}</span>
                    </div>
                    <p className="text-caption font-caption text-on-surface-variant line-clamp-2">{t.description}</p>
                    <p className="text-xs text-primary mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Use this template →</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline preview: live examples or template fallback */}
          {!templateGridOpen && (
            <div className="text-left">
              <p className="text-label-mono font-label-mono text-on-surface-variant text-xs uppercase tracking-wider mb-3">
                {showInspirationFallback ? 'Template ideas' : 'How other artists package their work'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {showInspirationFallback
                  ? fallbackTemplates.map((t) => (
                      <TemplatePreviewCard key={t.id} tpl={t} onUse={() => openAdd({ prefill: templateToFormState(t) })} />
                    ))
                  : previewCards.map((card) => (
                      <InspirationPreviewCard
                        key={card.packageId}
                        card={card}
                        onUse={() => openAdd({ prefill: inspirationToForm(card) })}
                      />
                    ))}
              </div>
              {!showInspirationFallback && (
                <div className="mt-4 text-center">
                  <Link href="/dashboard/packages/inspiration" className="text-primary text-label-mono font-label-mono text-sm hover:underline">
                    See more examples →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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

          {/* Subdued templates + inspiration section for artists who already have packages */}
          <div className="mt-6 border-t border-outline-variant/20 pt-5">
            <button
              onClick={() => setTemplateGridOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${templateGridOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Need more ideas? Browse templates &amp; examples
            </button>

            {templateGridOpen && (
              <div className="mt-4">
                {/* Template grid */}
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Templates</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                  {allTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTemplateGridOpen(false);
                        openAdd({ prefill: templateToFormState(t) });
                      }}
                      className="text-left rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 p-3.5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">{t.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full shrink-0">{t.duration}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">{t.description}</p>
                    </button>
                  ))}
                </div>

                {/* Inspiration preview */}
                {inspiration.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-2">How other artists package their work</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {previewCards.map((card) => (
                        <InspirationPreviewCard
                          key={card.packageId}
                          card={card}
                          onUse={() => { setTemplateGridOpen(false); openAdd({ prefill: inspirationToForm(card) }); }}
                        />
                      ))}
                    </div>
                  </>
                )}
                <Link
                  href="/dashboard/packages/inspiration"
                  className="text-xs text-primary hover:underline"
                >
                  See all examples →
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Export rate card */}
      <div className="mt-8 pt-6 border-t border-outline-variant/20">
        <button
          onClick={() => setExportModalOpen(true)}
          className="inline-flex items-center gap-2 text-primary text-label-mono font-label-mono text-sm hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export rate card PDF
        </button>
      </div>

      {/* Package drawer */}
      {drawerOpen && (
        <PackageDrawer
          key={editing ? editing.id : `new-${drawerSeq}`}
          editing={editing}
          onClose={closeDrawer}
          artistSlug={artistSlug}
          artForm={artForm}
          prefill={activePrefill}
          initialTemplatePickerOpen={pickerOpen}
          onSaved={handleSaved}
        />
      )}

      {/* Export modal */}
      {exportModalOpen && (
        <ExportModal
          mode="rate-card"
          slug={artist.slug}
          artistName={artist.name}
          hasPhoto={!!artist.profile_photo}
          hasBio={!!artist.bio}
          hasTagline={!!artist.tagline}
          artistPhoto={artist.profile_photo ?? null}
          artistTagline={artist.tagline ?? null}
          artistBio={artist.bio ?? null}
          artistCity={artist.city ?? null}
          artistCountry={artist.country ?? null}
          artForms={Array.isArray(artist.art_forms) ? artist.art_forms : []}
          artistTags={Array.isArray(artist.tags) ? artist.tags : null}
          socialLinks={artist.social_links ?? {}}
          selectedWorks={(Array.isArray(artist.selected_works) ? artist.selected_works : []) as any[]}
          packages={packages.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: p.currency,
            duration: p.duration ?? null,
            description: p.description ?? null,
            logistics_inclusive: p.logistics_inclusive,
          }))}
          savedEPK={artist.epk_data ?? null}
          savedRC={artist.rate_card_data ?? null}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </>
  );
}
