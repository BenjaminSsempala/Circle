'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArtistModePrompt } from './ArtistModePrompt';

type WorkItem = {
  id: string;
  title: string;
  provider: string;
  thumbnail_url: string;
  media_url: string;
  order?: number;
};

export type DiscoverArtist = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  profile_photo: string | null;
  feature_media?: string | null;
  art_forms: string[];
  tags: string[] | null;
  booking_contexts?: string[] | null;
  city: string | null;
  country: string | null;
  completed_bookings: number;
  min_price?: number;
  currency?: string;
  min_package_name?: string | null;
  selected_works?: WorkItem[] | null;
};

interface Props {
  artist: DiscoverArtist;
  isSaved: boolean;
  isGuest: boolean;
  isArtist?: boolean;
  onSaveToggle: () => void;
  inviteMode?: boolean;
  invited?: boolean;
  onInvite?: () => Promise<void>;
}

const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  soundcloud: 'SoundCloud',
  cloudinary: 'Video',
};


function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-colors ${filled ? 'text-error fill-current' : 'text-on-surface-variant'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="7" height="9" viewBox="0 0 7 9" fill="white">
      <path d="M0 0l7 4.5L0 9V0z" />
    </svg>
  );
}

function PlatformIcon({ provider }: { provider: string }) {
  switch (provider) {
    case 'youtube':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.02-.04z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M1.175 12.225c-.015 0-.03.015-.03.03l-.315 2.116.315 2.062c0 .015.015.03.03.03s.03-.015.03-.03l.36-2.062-.36-2.116c0-.015-.015-.03-.03-.03zm-.899.828c-.015 0-.03.015-.045.03l-.226 1.288.226 1.243c.015.015.03.03.045.03s.03-.015.045-.03l.256-1.243-.256-1.288c-.015-.015-.03-.03-.045-.03zM24 10.314c0-2.073-1.68-3.75-3.75-3.75-.72 0-1.395.21-1.965.57C18.015 4.89 15.57 3 12.63 3 11.1 3 9.72 3.54 8.64 4.425 7.845 5.085 7.26 5.97 6.915 6.975c-.27.015-.54.03-.795.075-2.505.555-4.125 2.985-3.57 5.49.315 1.41 1.2 2.58 2.43 3.255v.015H20.25C22.305 15.81 24 14.115 24 12.06c0-.63-.165-1.23-.45-1.755l.45.009z" />
        </svg>
      );
    default:
      return null;
  }
}

export function ArtistCard({ artist, isSaved, isGuest, isArtist, onSaveToggle, inviteMode, invited, onInvite }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showArtistPrompt, setShowArtistPrompt] = useState(false);

  const photoSrc = artist.profile_photo || artist.feature_media || null;

  // Up to 2 tag chips: art_forms first, then booking_contexts
  const tags = [
    ...(artist.art_forms ?? []),
    ...(artist.booking_contexts ?? []),
  ].slice(0, 2);

  // First selected work sorted by order
  const firstWork =
    Array.isArray(artist.selected_works) && artist.selected_works.length > 0
      ? [...artist.selected_works].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
      : null;

  function handleCardClick() {
    router.push(`/${artist.slug}`);
  }

  function handleHeart(e: React.MouseEvent) {
    e.stopPropagation();
    if (isArtist) { setShowArtistPrompt(true); return; }
    if (saving) return;
    if (isGuest) { onSaveToggle(); return; }
    setSaving(true);
    onSaveToggle();
    setSaving(false);
  }

  function handleBookClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isArtist) { setShowArtistPrompt(true); return; }
    if (isGuest) { onSaveToggle(); return; }
    router.push(`/${artist.slug}`);
  }

  function handleMediaClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (firstWork?.media_url) {
      window.open(firstWork.media_url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <>
      {showArtistPrompt && <ArtistModePrompt onClose={() => setShowArtistPrompt(false)} />}
      <article
        onClick={handleCardClick}
        className="group flex h-[280px] bg-white border border-[#E4E4E0] rounded-[14px] overflow-hidden hover:shadow-lg hover:border-outline-variant/60 transition-all duration-300 cursor-pointer"
      >
        {/* Left: photo block */}
        <div className="relative w-[170px] flex-shrink-0">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={artist.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, #2d2520 0%, #1a1a1a 100%)' }}
            />
          )}

          {/* Art form badge */}
          {artist.art_forms[0] && (
            <span className="absolute top-2 left-2 bg-[#C17A2A] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ borderRadius: 3 }}>
              {artist.art_forms[0]}
            </span>
          )}

          {/* Heart/save */}
          <button
            onClick={handleHeart}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)' }}
            title={isSaved ? 'Unsave' : 'Save artist'}
            aria-label={isSaved ? 'Unsave artist' : 'Save artist'}
          >
            <HeartIcon filled={isSaved} />
          </button>
        </div>

        {/* Right: content */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Identity + tags + price */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold text-on-surface leading-tight truncate">
                  {artist.name}
                </h3>
                {(artist.city || artist.country) && (
                  <p className="text-[12px] text-outline mt-0.5">
                    {[artist.city, artist.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end max-w-[130px]">
                  {tags.map((t) => (
                    <span key={t} className="bg-[#F0F4F2] text-[#2D6A4F] px-2 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price + CTA */}
            <div className="mt-auto flex items-end justify-between gap-2">
              {artist.min_price ? (
                <div>
                  <div className="text-[10px] text-outline uppercase font-bold tracking-wider mb-0.5">Book From</div>
                  <div className="text-primary font-mono text-[15px] leading-none flex items-baseline flex-wrap">
                    <span>{artist.currency ?? 'UGX'} {artist.min_price.toLocaleString()}</span>
                    {artist.min_package_name && (
                      <span className="text-[10px] text-on-surface-variant font-sans font-normal lowercase ml-1">
                        for {artist.min_package_name}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-[12px] text-on-surface-variant italic">Price on request</span>
              )}
              {inviteMode ? (
                <span
                  onClick={(e) => { e.stopPropagation(); if (!invited && onInvite) onInvite(); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${invited
                      ? 'border-primary/30 text-primary/40 cursor-default'
                      : 'border-primary text-primary hover:bg-primary/5'
                    }`}
                >
                  {invited ? 'Invited ✓' : 'Invite to gig'}
                </span>
              ) : artist.min_price ? (
                <span
                  onClick={handleBookClick}
                  className="flex-shrink-0 bg-[#2D6A4F] text-white px-5 py-2 rounded-full text-[12px] font-bold hover:bg-primary transition-colors cursor-pointer"
                >
                  {isGuest || isArtist ? 'View profile' : 'Book now'}
                </span>
              ) : null}
            </div>
          </div>

          {/* Media preview: ~half card height */}
          {firstWork && (
            <div
              onClick={handleMediaClick}
              className="border-t border-[#E4E4E0] flex overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
              style={{ height: 124 }}
            >
              {/* Thumbnail: fills full strip height */}
              <div className="relative flex-shrink-0 bg-black" style={{ width: 124 }}>
                {firstWork.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstWork.thumbnail_url}
                    alt={firstWork.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <PlayIcon />
                  </div>
                </div>
                {/* Platform icon: bottom-right */}
                {PlatformIcon({ provider: firstWork.provider }) && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <PlatformIcon provider={firstWork.provider} />
                  </div>
                )}
              </div>

              {/* Info panel */}
              <div className="flex-1 min-w-0 bg-[#FAFAF8] px-3 py-3 flex flex-col justify-between">
                <p className="text-[12px] text-on-surface font-semibold leading-snug line-clamp-3">
                  {firstWork.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant">
                    Now playing
                  </span>
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <PlayIcon />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
