'use client';

import Link from 'next/link';
import { useState } from 'react';

export type DiscoverArtist = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  profile_photo: string | null;
  art_forms: string[];
  tags: string[] | null;
  city: string | null;
  country: string | null;
  completed_bookings: number;
  min_price?: number;
  currency?: string;
};

interface Props {
  artist: DiscoverArtist;
  isSaved: boolean;
  isGuest: boolean;
  onSaveToggle: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-colors ${filled ? 'text-error' : 'text-white'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

export function ArtistCard({ artist, isSaved, isGuest, onSaveToggle }: Props) {
  const [saving, setSaving] = useState(false);

  const allTags = [...(artist.art_forms ?? []), ...(artist.tags ?? [])].slice(0, 3);
  const tagline = artist.bio ? artist.bio.split(/[.\n]/)[0].slice(0, 80) : null;

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    if (isGuest) { onSaveToggle(); return; }
    setSaving(true);
    onSaveToggle();
    setSaving(false);
  }

  return (
    <div className="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-lg hover:border-outline-variant/40 transition-all flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[3/4] bg-surface-container overflow-hidden">
        {artist.profile_photo ? (
          <img
            src={artist.profile_photo}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-5xl text-primary/30">♪</span>
          </div>
        )}

        {/* Art form badge */}
        {artist.art_forms[0] && (
          <span className="absolute top-3 left-3 bg-secondary-container/90 text-on-secondary-container text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm capitalize">
            {artist.art_forms[0]}
          </span>
        )}

        {/* Heart */}
        <button
          onClick={handleHeart}
          className="absolute top-3 right-3 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
          title={isSaved ? 'Unsave' : 'Save artist'}
        >
          <HeartIcon filled={isSaved} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="text-label-mono font-label-mono text-on-surface font-bold text-base leading-tight">
            {artist.name}
          </h3>
          {artist.city && (
            <p className="text-caption font-caption text-on-surface-variant text-xs mt-0.5">
              {[artist.city, artist.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {tagline && (
          <p className="text-caption font-caption text-on-surface-variant text-xs line-clamp-2 leading-relaxed">
            {tagline}
          </p>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant capitalize">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          {artist.min_price ? (
            <span className="text-caption font-caption text-on-surface-variant text-xs">
              From <span className="text-on-surface font-bold">{artist.currency ?? 'UGX'} {artist.min_price.toLocaleString()}</span>
            </span>
          ) : (
            <span className="text-caption font-caption text-on-surface-variant text-xs">Price on request</span>
          )}
          {artist.completed_bookings > 0 && (
            <span className="text-[10px] text-on-surface-variant">
              {artist.completed_bookings} booking{artist.completed_bookings !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <Link
          href={`/${artist.slug}`}
          className="block text-center bg-primary text-on-primary text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity mt-1"
          onClick={(e) => { if (isGuest) { e.preventDefault(); onSaveToggle(); } }}
        >
          {isGuest ? 'View profile' : 'Book now'}
        </Link>
      </div>
    </div>
  );
}
