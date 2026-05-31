'use client';

import { useEffect } from 'react';
import type { Work } from '@/lib/services/artists';

function extractInstagramEmbed(url: string): string | null {
  const post = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
  if (post) return `https://www.instagram.com/p/${post[1]}/embed/captioned/`;
  const reel = url.match(/instagram\.com\/reel(?:s)?\/([A-Za-z0-9_-]+)/);
  if (reel) return `https://www.instagram.com/reel/${reel[1]}/embed/`;
  return null; // profile URL — will show handle card
}

function buildEmbedUrl(work: Work): string | null {
  if (work.provider === 'spotify') {
    const m = work.media_url.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([a-zA-Z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null;
  }
  if (work.provider === 'soundcloud') {
    const p = new URLSearchParams({ url: work.media_url, auto_play: 'true', color: '#005440', show_comments: 'false' });
    return `https://w.soundcloud.com/player/?${p}`;
  }
  if (work.provider === 'instagram') {
    return extractInstagramEmbed(work.media_url);
  }
  return null;
}

export function MediaPreviewModal({ work, onClose }: { work: Work; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const embedUrl = buildEmbedUrl(work);

  // YouTube and TikTok open in a new tab
  if (work.provider === 'youtube' || work.provider === 'tiktok') {
    window.open(work.media_url, '_blank', 'noopener,noreferrer');
    onClose();
    return null;
  }

  // Instagram: posts/reels embed fine; profile URLs open externally
  if (work.provider === 'instagram' && !extractInstagramEmbed(work.media_url)) {
    window.open(work.media_url, '_blank', 'noopener,noreferrer');
    onClose();
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Close
        </button>

        {/* Content */}
        {work.provider === 'cloudinary' && work.type === 'image' ? (
          <img
            src={work.media_url}
            alt={work.title}
            className="w-full max-h-[80vh] object-contain rounded-xl"
          />
        ) : work.provider === 'cloudinary' && work.type === 'document' ? (
          <div className="bg-surface rounded-xl p-8 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-16 h-16 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-on-surface font-semibold text-lg">{work.title}</p>
            <a
              href={work.media_url}
              download
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Download PDF
            </a>
          </div>
        ) : embedUrl ? (
          <div className={`rounded-xl overflow-hidden ${
            work.type === 'audio' ? 'h-40' :
            work.provider === 'instagram' ? 'max-w-sm mx-auto' :
            'aspect-video'
          }`}>
            <iframe
              src={embedUrl}
              className="w-full"
              height={work.provider === 'instagram' ? 700 : undefined}
              style={{ border: 'none', height: work.provider === 'instagram' ? '700px' : '100%' }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              title={work.title}
            />
          </div>
        ) : (
          <div className="bg-surface rounded-xl p-8 text-center">
            <p className="text-on-surface-variant">Unable to preview this content.</p>
            <a href={work.media_url} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 block">
              Open in new tab
            </a>
          </div>
        )}

        {/* Caption */}
        {(work.title || work.category) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-white font-semibold">{work.title}</p>
            {work.category && <span className="text-white/60 text-sm">{work.category}{work.metadata?.year ? ` · ${work.metadata.year}` : ''}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
