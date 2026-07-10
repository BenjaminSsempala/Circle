'use client';

import { useState, useRef, useEffect } from 'react';
import { useDashboardExport } from './DashboardClient';

export function ExportButton({ slug }: { slug: string }) {
  const { onOpenExport } = useDashboardExport();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProfileCard, setLoadingProfileCard] = useState(false);
  const [profileCardError, setProfileCardError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [isOpen]);

  async function handleProfileCardDownload() {
    setLoadingProfileCard(true);
    setProfileCardError(null);
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
      setIsOpen(false);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to generate profile card';
      console.error('[profile-card] failed:', e);
      setProfileCardError(errorMsg);
    } finally {
      setLoadingProfileCard(false);
    }
  }

  const Spinner = () => (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-full flex flex-col items-center gap-2 bg-surface-container rounded-xl p-3 hover:bg-surface-container-high transition-colors text-center"
      >
        <span className="text-xl">📥</span>
        <span className="text-caption font-caption text-on-surface text-xs">Export profile</span>
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-1.5 z-50">
          {/* EPK */}
          <button
            role="menuitem"
            onClick={() => { onOpenExport('epk'); setIsOpen(false); }}
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

          {/* Rate Card */}
          <button
            role="menuitem"
            onClick={() => { onOpenExport('rate-card'); setIsOpen(false); }}
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

          {/* Profile Card */}
          <button
            role="menuitem"
            onClick={handleProfileCardDownload}
            disabled={loadingProfileCard}
            className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container transition-colors text-left disabled:opacity-60"
          >
            {loadingProfileCard ? <Spinner /> : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 text-on-surface-variant mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            )}
            <span>
              <span className="block text-sm text-on-surface font-semibold">
                {loadingProfileCard ? 'Generating…' : 'Profile Card (Image)'}
              </span>
              <span className={`block text-xs font-normal ${profileCardError ? 'text-red-500' : 'text-on-surface-variant'}`}>
                {profileCardError ? `Error: ${profileCardError}` : '9:16 story card PNG'}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
