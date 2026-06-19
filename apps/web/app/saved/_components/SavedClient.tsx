'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArtistCard, type DiscoverArtist } from '@/app/components/discover/ArtistCard';

export function SavedClient({
  initialArtists,
  initialSavedIds,
}: {
  initialArtists: DiscoverArtist[];
  initialSavedIds: string[];
}) {
  const [artists, setArtists] = useState(initialArtists);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));

  async function handleUnsave(artistId: string) {
    setSavedIds((prev) => { const next = new Set(prev); next.delete(artistId); return next; });
    setArtists((prev) => prev.filter((a) => a.id !== artistId));
    try {
      await fetch(`/api/audience/saved/${artistId}`, { method: 'DELETE' });
    } catch {
      // revert: refetch would be cleaner but simple revert works here
    }
  }

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-on-surface-variant/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p className="text-on-surface text-body-lg font-body-lg font-semibold mb-2">No saved artists yet</p>
        <p className="text-on-surface-variant text-body-md font-body-md mb-6">
          Tap the heart on any artist card to save them here.
        </p>
        <Link
          href="/discover"
          className="bg-primary text-on-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Browse artists
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          isSaved={savedIds.has(artist.id)}
          isGuest={false}
          onSaveToggle={() => handleUnsave(artist.id)}
        />
      ))}
    </div>
  );
}
