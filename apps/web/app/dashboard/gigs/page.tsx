'use client';

import { useEffect, useState } from 'react';
import { ApplyToGigPanel } from '@/app/components/gigs/ApplyToGigPanel';
import type { GigPost } from '@/lib/services/gigs';

type GigWithApplied = GigPost & { alreadyApplied: boolean };

const DISCIPLINES = ['All', 'Musician', 'Dancer', 'Poet', 'Visual Artist', 'Spoken Word', 'Actor', 'Videographer'];

function GigCard({
  gig,
  onApply,
}: {
  gig: GigWithApplied;
  onApply: (gig: GigPost) => void;
}) {
  return (
    <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm hover:border-primary/20 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-on-surface text-base leading-snug">{gig.title}</h3>
        {gig.alreadyApplied && (
          <span className="flex-shrink-0 flex items-center gap-1 bg-[#E1F5EE] text-primary text-[11px] font-mono px-2.5 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M4.5 12.75l6 6 9-13.5" stroke="#005440" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Applied
          </span>
        )}
      </div>

      {/* Discipline chips */}
      {gig.discipline.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {gig.discipline.map((d) => (
            <span key={d} className="bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Details row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-on-surface-variant text-xs">Budget</span>
          <div className="font-bold text-primary">{gig.currency} {Number(gig.budget).toLocaleString()}</div>
        </div>
        <div>
          <span className="text-on-surface-variant text-xs">Duration</span>
          <div className="font-semibold text-on-surface">{gig.slot_duration}</div>
        </div>
        {gig.gig_date && (
          <div>
            <span className="text-on-surface-variant text-xs">Date</span>
            <div className="font-semibold text-on-surface">{gig.gig_date}</div>
          </div>
        )}
        {gig.venue && (
          <div>
            <span className="text-on-surface-variant text-xs">Venue</span>
            <div className="font-semibold text-on-surface truncate max-w-[160px]">{gig.venue}</div>
          </div>
        )}
      </div>

      {gig.description && (
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{gig.description}</p>
      )}

      {!gig.alreadyApplied && (
        <button
          onClick={() => onApply(gig)}
          className="mt-1 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          Apply
        </button>
      )}
    </div>
  );
}

export default function GigFeedPage() {
  const [gigs, setGigs] = useState<GigWithApplied[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [applyGig, setApplyGig] = useState<GigPost | null>(null);

  async function loadGigs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDiscipline !== 'All') params.set('discipline', selectedDiscipline);
      const res = await fetch(`/api/gigs?${params.toString()}`);
      const data = await res.json();
      setGigs(data?.gigs ?? []);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiscipline]);

  function handleApplied() {
    setApplyGig(null);
    loadGigs();
  }

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Gig Feed</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Open gigs looking for artists like you.
        </p>
      </div>

      {/* Discipline filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {DISCIPLINES.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDiscipline(d)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedDiscipline === d
                ? 'bg-primary text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-outline-variant/30 rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-surface-container rounded w-2/3 mb-3" />
              <div className="h-3 bg-surface-container rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-container rounded w-full" />
            </div>
          ))}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🎭</div>
          <p className="text-on-surface-variant text-sm">No open gigs right now.</p>
          <p className="text-on-surface-variant text-xs mt-1">Check back soon — new gigs are posted regularly.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {gigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig}
              onApply={(g) => setApplyGig(g)}
            />
          ))}
        </div>
      )}

      {applyGig && (
        <ApplyToGigPanel
          gig={applyGig}
          isOpen={true}
          onClose={handleApplied}
        />
      )}
    </div>
  );
}
