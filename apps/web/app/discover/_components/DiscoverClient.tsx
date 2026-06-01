'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArtistCard, type DiscoverArtist } from '@/app/components/discover/ArtistCard';
import { FilterBar } from '@/app/components/discover/FilterBar';
import { GuestBlurOverlay } from '@/app/components/discover/GuestBlurOverlay';
import { OccasionBanner } from '@/app/components/discover/OccasionBanner';

const GUEST_VISIBLE = 10;

// Maps filter chip labels → all stored values that should match.
// Onboarding stores raw option values (e.g. "spoken-word", "visual", "theater").
const ART_FORM_MAP: Record<string, string[]> = {
  'Musician':     ['musician'],
  'Dancer':       ['dancer'],
  'Poet':         ['poet'],
  'Visual Artist':['visual', 'visual artist', 'visual_artist'],
  'Spoken Word':  ['spoken-word', 'spoken word', 'spoken_word', 'spoken word artist'],
  'Actor':        ['theater', 'actor', 'theatre'],
  'Videographer': ['digital', 'videographer', 'cinematographer'],
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[-_]+/g, ' ').trim();
}

function matchesArtFormFilter(artForms: string[], filterLabel: string): boolean {
  const targets = ART_FORM_MAP[filterLabel];
  if (!targets) {
    // Fallback: normalized includes comparison
    const nf = normalize(filterLabel);
    return artForms.some((f) => normalize(f).includes(nf) || nf.includes(normalize(f)));
  }
  return artForms.some((f) => targets.includes(normalize(f)));
}

interface Props {
  artists: DiscoverArtist[];
  isGuest: boolean;
  initialSavedIds: string[];
  showOccasionBanner: boolean;
}

export function DiscoverClient({ artists, isGuest, initialSavedIds, showOccasionBanner }: Props) {
  const params = useSearchParams();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [showBanner, setShowBanner] = useState(showOccasionBanner);

  const artForm = params.get('artForm') ?? '';
  const budgetMin = Number(params.get('budgetMin') ?? 0);
  const budgetMax = Number(params.get('budgetMax') ?? 0);
  const location = (params.get('location') ?? '').toLowerCase();

  const filtered = useMemo(() => {
    return artists.filter((a) => {
      if (artForm && artForm !== 'All') {
        if (!matchesArtFormFilter(a.art_forms, artForm)) return false;
      }
      if (location) {
        const cityMatch = (a.city ?? '').toLowerCase().includes(location);
        if (!cityMatch) return false;
      }
      if (budgetMin || budgetMax) {
        if (!a.min_price) return false;
        if (budgetMin && a.min_price < budgetMin) return false;
        if (budgetMax && a.min_price > budgetMax) return false;
      }
      return true;
    });
  }, [artists, artForm, location, budgetMin, budgetMax]);

  async function toggleSave(artistId: string) {
    if (isGuest) return; // guest save triggers GuestBlurOverlay via ArtistCard
    const wasSaved = savedIds.has(artistId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(artistId);
      else next.add(artistId);
      return next;
    });
    try {
      if (wasSaved) {
        await fetch(`/api/audience/saved/${artistId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/audience/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artistId }),
        });
      }
    } catch {
      // revert
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(artistId);
        else next.delete(artistId);
        return next;
      });
    }
  }

  const visibleArtists = isGuest ? filtered.slice(0, GUEST_VISIBLE) : filtered;
  const blurredArtists = isGuest ? filtered.slice(GUEST_VISIBLE) : [];

  return (
    <>
      {showBanner && <OccasionBanner onDismiss={() => setShowBanner(false)} />}

      <FilterBar totalCount={filtered.length} />

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleArtists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            isSaved={savedIds.has(artist.id)}
            isGuest={isGuest}
            onSaveToggle={() => toggleSave(artist.id)}
          />
        ))}

        {/* Blurred cards for guest */}
        {blurredArtists.length > 0 && (
          <>
            {blurredArtists.map((artist) => (
              <div key={artist.id} className="blur-sm pointer-events-none select-none opacity-60">
                <ArtistCard
                  artist={artist}
                  isSaved={false}
                  isGuest={true}
                  onSaveToggle={() => {}}
                />
              </div>
            ))}
            <GuestBlurOverlay />
          </>
        )}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-on-surface-variant text-body-md font-body-md">No artists match your filters.</p>
            <button
              onClick={() => window.location.href = '/discover'}
              className="mt-3 text-primary text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </>
  );
}
