'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExportModal, type ExportModalMode } from './ExportModal';
import type { EPKFillable, RateCardFillable } from '@/lib/exports/exportTypes';

type Panel = 'share' | 'export' | null;

function useClickOutside(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

// ─── Share panel ──────────────────────────────────────────────────────────────

function SharePanel({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `thecircle.co/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1800);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Check out my Circle profile: https://${profileUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleStoryDownload = () => {
    triggerDownload(`/api/artists/${slug}/share-card`, `${slug}-circle-story.png`);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-1.5 z-50">
      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
      <button
        onClick={handleWhatsApp}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        Share to WhatsApp
      </button>
      <div className="my-1 border-t border-outline-variant/20" />
      <button
        onClick={handleStoryDownload}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <span>
          Instagram Story
          <span className="block text-xs text-on-surface-variant font-normal">Downloads 9:16 profile card</span>
        </span>
      </button>
    </div>
  );
}

// ─── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel({
  slug,
  onOpenModal,
  onClose,
}: {
  slug: string;
  onOpenModal: (mode: ExportModalMode) => void;
  onClose: () => void;
}) {
  const [loadingShareCard, setLoadingShareCard] = useState(false);

  async function handleShareCard() {
    setLoadingShareCard(true);
    try {
      const res = await fetch(`/api/artists/${slug}/share-card`);
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${slug}-profile-card.png`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      onClose();
    } catch (e) {
      console.error('[share-card] failed:', e);
    } finally {
      setLoadingShareCard(false);
    }
  }

  const Spinner = () => (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-1.5 z-50">

      {/* EPK → opens modal */}
      <button
        onClick={() => { onOpenModal('epk'); onClose(); }}
        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors text-left"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span>
          <span className="block text-sm text-on-surface font-semibold">EPK (PDF)</span>
          <span className="block text-xs text-on-surface-variant font-normal">Electronic Press Kit</span>
        </span>
      </button>

      {/* Rate Card → opens modal */}
      <button
        onClick={() => { onOpenModal('rate-card'); onClose(); }}
        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors text-left"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        <span>
          <span className="block text-sm text-on-surface font-semibold">Rate Card</span>
          <span className="block text-xs text-on-surface-variant font-normal">PDF or 1080×1080 PNG</span>
        </span>
      </button>

      <div className="my-1 border-t border-outline-variant/20" />

      {/* Profile Card → direct download (no fillable data needed) */}
      <button
        onClick={handleShareCard}
        disabled={loadingShareCard}
        className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors text-left disabled:opacity-60"
      >
        {loadingShareCard ? <Spinner /> : (
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        )}
        <span>
          <span className="block text-sm text-on-surface font-semibold">
            {loadingShareCard ? 'Generating…' : 'Profile Card (Image)'}
          </span>
          <span className="block text-xs text-on-surface-variant font-normal">9:16 story card PNG</span>
        </span>
      </button>
    </div>
  );
}

// ─── Owner bar ────────────────────────────────────────────────────────────────

export function OwnerBar({
  slug, hasPhoto, hasBio, hasTagline,
  artistName, artistPhoto, artistTagline, artistBio,
  artistCity, artistCountry, artForms, artistTags,
  socialLinks, selectedWorks, packages,
  savedEPK, savedRC,
}: {
  slug: string;
  hasPhoto: boolean;
  hasBio: boolean;
  hasTagline: boolean;
  artistName: string;
  artistPhoto: string | null;
  artistTagline: string | null;
  artistBio: string | null;
  artistCity: string | null;
  artistCountry: string | null;
  artForms: string[];
  artistTags: string[] | null;
  socialLinks: Record<string, string>;
  selectedWorks: import('@/app/[slug]/_components/ExportModal').ExportWork[];
  packages: import('@/app/[slug]/_components/ExportModal').ExportPackage[];
  savedEPK: EPKFillable | null;
  savedRC: RateCardFillable | null;
}) {
  const [open, setOpen] = useState<Panel>(null);
  const [exportModal, setExportModal] = useState<ExportModalMode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(null));

  const toggle = (panel: Panel) => setOpen((prev) => (prev === panel ? null : panel));

  return (
    <>
    <div className="w-full bg-primary/5 border-b border-primary/10 relative z-40">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-2.5 flex items-center justify-between gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 text-sm text-primary/80">
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="hidden sm:inline font-medium">This is your profile! Here&apos;s how clients see it.</span>
          <span className="sm:hidden font-medium">Your profile</span>
        </div>

        {/* Buttons */}
        <div ref={containerRef} className="flex items-center gap-2 flex-shrink-0">
          {/* Share */}
          <div className="relative">
            <button
              onClick={() => toggle('share')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                open === 'share'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-primary/20 text-primary hover:bg-primary/5'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              Share
              <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {open === 'share' && <SharePanel slug={slug} onClose={() => setOpen(null)} />}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => toggle('export')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                open === 'export'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-primary/20 text-primary hover:bg-primary/5'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
              <svg viewBox="0 0 24 24" className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {open === 'export' && (
              <ExportPanel
                slug={slug}
                onOpenModal={setExportModal}
                onClose={() => setOpen(null)}
              />
            )}
          </div>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>

    {/* Export modal — centred overlay, rendered outside the bar so it's full-viewport */}
    {exportModal && (
      <ExportModal
        mode={exportModal}
        slug={slug}
        artistName={artistName}
        hasPhoto={hasPhoto}
        hasBio={hasBio}
        hasTagline={hasTagline}
        artistPhoto={artistPhoto}
        artistTagline={artistTagline}
        artistBio={artistBio}
        artistCity={artistCity}
        artistCountry={artistCountry}
        artForms={artForms}
        artistTags={artistTags}
        socialLinks={socialLinks}
        selectedWorks={selectedWorks}
        packages={packages}
        savedEPK={savedEPK}
        savedRC={savedRC}
        onClose={() => setExportModal(null)}
      />
    )}
    </>
  );
}
