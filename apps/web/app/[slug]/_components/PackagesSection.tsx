'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookingPanel } from '../../components/booking/BookingPanel';
import { getTemplatesForArtForm } from '@/lib/data/package-templates';
import { templateToFormState, type PackageFormState } from '@/lib/packages/prefill';
import { PackageDrawer, type Package as DrawerPackage } from '@/app/components/packages/PackageDrawer';

type ProductType = 'service' | 'digital' | 'merchandise';

type CancellationTerms = {
  within_48_hours_refund_pct: number;
  within_7_days_refund_pct: number;
  more_than_7_days_refund_pct: number;
};

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration: string | null;
  logistics_inclusive: boolean;
  product_type?: ProductType;
  cancellation_terms?: CancellationTerms | null;
};

type ArtistInfo = {
  slug: string;
  name: string;
  profile_photo: string | null;
  social_links: Record<string, string>;
  account_email: string | null;
  art_forms?: string[] | null;
};

function formatPrice(price: number, currency: string) {
  return `${currency} ${Number(price).toLocaleString()}`;
}

/** Cast a local Package to the full DrawerPackage shape, supplying safe defaults for missing fields. */
function fullPackageFromLocal(pkg: Package): DrawerPackage {
  return {
    ...pkg,
    tier: 'standard',
    is_active: true,
    created_at: '',
    product_type: pkg.product_type ?? 'service',
    auto_accept: false,
    contract_required: true,
  };
}

function ReadonlyCard({ pkg, featured, isOwner, onEdit, onDelete, onBook }: {
  pkg: Package; featured: boolean; isOwner: boolean;
  onEdit: () => void; onDelete: () => void; onBook: () => void;
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

      {pkg.logistics_inclusive && (
        <div className="flex items-center gap-2 text-body-md font-body-md text-on-surface">
          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-primary/10">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <span className="text-sm">Transport included</span>
        </div>
      )}

      {!isOwner && (
        <button
          onClick={onBook}
          className={`mt-auto w-full py-2 px-4 rounded-lg text-label-mono font-label-mono transition-colors flex justify-center items-center gap-xs ${featured ? 'bg-secondary text-white hover:bg-on-secondary-container shadow-sm' : 'bg-transparent border border-primary text-primary hover:bg-primary/5'}`}
        >
          Book Now
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function PackagesSection({ packages: initial, isOwner, isLoggedIn, artist }: {
  packages: Package[];
  isOwner: boolean;
  isLoggedIn: boolean;
  artist: ArtistInfo;
}) {
  const [packages, setPackages] = useState(initial);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEditing, setDrawerEditing] = useState<Package | null>(null);
  const [drawerPrefill, setDrawerPrefill] = useState<PackageFormState | null>(null);
  const [drawerPickerOpen, setDrawerPickerOpen] = useState(false);
  const [bookingPkg, setBookingPkg] = useState<Package | null>(null);
  const [templateGridOpen, setTemplateGridOpen] = useState(false);

  const artForm = artist.art_forms?.[0] ?? null;
  const allTemplates = getTemplatesForArtForm(artForm);

  function openDrawer() {
    setDrawerEditing(null);
    setDrawerPrefill(null);
    setDrawerPickerOpen(false);
    setDrawerOpen(true);
  }

  function openEdit(pkg: Package) {
    setDrawerEditing(pkg);
    setDrawerPrefill(null);
    setDrawerPickerOpen(false);
    setDrawerOpen(true);
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-md">
      {(packages.length > 0 || isOwner) && (
        <div className="flex items-center justify-between">
          <h3 className="text-headline-md font-headline-md text-primary">Booking Packages</h3>
          {isOwner && (
            <button onClick={openDrawer} className="flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add package
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-sm">
        {packages.map((pkg, i) => (
          <ReadonlyCard
            key={pkg.id}
            pkg={pkg}
            featured={i === 0}
            isOwner={isOwner}
            onEdit={() => openEdit(pkg)}
            onDelete={() => handleDelete(pkg.id)}
            onBook={() => setBookingPkg(pkg)}
          />
        ))}

        {/* Subdued templates section for owners who already have packages */}
        {packages.length > 0 && isOwner && (
          <div className="mt-2 border-t border-outline-variant/20 pt-4">
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
              Need more ideas? Browse templates
            </button>

            {templateGridOpen && (
              <div className="mt-3 flex flex-col gap-2">
                {allTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setDrawerPrefill(templateToFormState(t));
                      setDrawerEditing(null);
                      setDrawerPickerOpen(false);
                      setTemplateGridOpen(false);
                      setDrawerOpen(true);
                    }}
                    className="text-left rounded-xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 px-3 py-2.5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">{t.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant shrink-0">{t.duration}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">{t.description}</p>
                  </button>
                ))}
                <Link
                  href="/dashboard/packages/inspiration"
                  className="text-xs text-primary hover:underline mt-1"
                >
                  See how other artists do it →
                </Link>
              </div>
            )}
          </div>
        )}

        {packages.length === 0 && !isOwner && (
          <div className="rounded-xl border border-outline-variant/30 p-md text-center">
            <p className="text-body-md font-body-md text-on-surface-variant">No packages listed yet.</p>
          </div>
        )}

        {packages.length === 0 && isOwner && (
          <div className="rounded-xl border border-dashed border-outline-variant/40 p-md flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-on-surface-variant">No packages yet. Add one to start getting booked.</p>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setTemplateGridOpen((o) => !o)}
                className="w-full min-h-[44px] bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
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
                className="w-full min-h-[44px] inline-flex items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors"
              >
                See how other artists do it
              </Link>
            </div>

            {/* Inline template grid */}
            {templateGridOpen && (
              <div className="w-full text-left mt-1">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-2">
                  Choose a template
                </p>
                <div className="flex flex-col gap-2">
                  {allTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setDrawerPrefill(templateToFormState(t));
                        setDrawerEditing(null);
                        setDrawerPickerOpen(false);
                        setTemplateGridOpen(false);
                        setDrawerOpen(true);
                      }}
                      className="text-left rounded-xl border border-outline-variant/30 hover:border-primary hover:bg-primary/5 px-3 py-2.5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{t.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant shrink-0">{t.duration}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/dashboard/packages"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              Go to full package manager →
            </Link>
          </div>
        )}
      </div>

      {drawerOpen && (
        <PackageDrawer
          key={drawerEditing ? drawerEditing.id : 'new'}
          editing={drawerEditing ? fullPackageFromLocal(drawerEditing) : null}
          artistSlug={artist.slug}
          artForm={artForm}
          prefill={drawerPrefill}
          initialTemplatePickerOpen={drawerPickerOpen}
          onClose={() => setDrawerOpen(false)}
          onSaved={(pkg) => {
            setPackages((prev) => {
              const idx = prev.findIndex((p) => p.id === pkg.id);
              if (idx === -1) return [...prev, pkg];
              const next = [...prev];
              next[idx] = pkg;
              return next;
            });
            setDrawerOpen(false);
          }}
        />
      )}

      {bookingPkg && (
        <BookingPanel
          pkg={bookingPkg}
          artist={artist}
          isLoggedIn={isLoggedIn}
          onClose={() => setBookingPkg(null)}
        />
      )}
    </div>
  );
}
