'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArtistCard, type DiscoverArtist } from '@/app/components/discover/ArtistCard';
import { FilterBar } from '@/app/components/discover/FilterBar';
import { GuestBlurOverlay } from '@/app/components/discover/GuestBlurOverlay';
import { OccasionBanner } from '@/app/components/discover/OccasionBanner';
import { artFormMatches } from '@/lib/data/art-forms';

const GUEST_VISIBLE = 10;

// Resolve a filter chip label against an artist's stored art-form values using the
// canonical registry matcher (folds in the former local alias map).
function matchesArtFormFilter(artForms: string[], filterLabel: string): boolean {
  return artForms.some((f) => artFormMatches(f, filterLabel));
}

interface Props {
  artists: DiscoverArtist[];
  isGuest: boolean;
  isArtist: boolean;
  initialSavedIds: string[];
  showOccasionBanner: boolean;
  inviteToGig?: { id: string; title: string };
}

export function DiscoverClient({ artists, isGuest, isArtist, initialSavedIds, showOccasionBanner, inviteToGig }: Props) {
  const params = useSearchParams();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [showBanner, setShowBanner] = useState(showOccasionBanner);
  const [inviteCount, setInviteCount] = useState(0);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

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

  async function handleInvite(artistId: string) {
    if (!inviteToGig) return;
    await fetch(`/api/gigs/${inviteToGig.id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId }),
    });
    setInvitedIds((prev) => new Set(prev).add(artistId));
    setInviteCount((c) => c + 1);
  }

  const visibleArtists = isGuest ? filtered.slice(0, GUEST_VISIBLE) : filtered;
  const blurredArtists = isGuest ? filtered.slice(GUEST_VISIBLE) : [];

  return (
    <>
      {showBanner && <OccasionBanner onDismiss={() => setShowBanner(false)} />}

      {/* Invite-to-gig banner */}
      {inviteToGig && (
        <div className="mb-4 bg-[#E1F5EE] border border-primary/20 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <div>
              <span className="text-sm font-semibold text-primary">Inviting artists to: </span>
              <span className="text-sm text-primary/80">{inviteToGig.title}</span>
            </div>
          </div>
          <span className="flex-shrink-0 font-mono text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {inviteCount} invited
          </span>
        </div>
      )}

      <FilterBar totalCount={filtered.length} />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleArtists.map((artist) => (
          <ArtistCard
            key={artist.id}
            artist={artist}
            isSaved={savedIds.has(artist.id)}
            isGuest={isGuest}
            isArtist={isArtist}
            onSaveToggle={() => toggleSave(artist.id)}
            inviteMode={!!inviteToGig}
            invited={invitedIds.has(artist.id)}
            onInvite={() => handleInvite(artist.id)}
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
