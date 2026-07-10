'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { GigPost } from '@/lib/services/gigs';

type Artist = {
  id: string;
  display_name: string | null;
  profile_photo: string | null;
  slug: string;
};

type Package = {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string | null;
};

type Application = {
  id: string;
  gig_post_id: string;
  artist_id: string;
  referenced_package_id: string | null;
  message: string;
  status: 'pending' | 'selected' | 'declined';
  applied_at: string;
  artists: Artist | null;
  packages: Package | null;
};

function ConfirmSelectModal({
  artistName,
  onConfirm,
  onCancel,
  loading,
}: {
  artistName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-on-surface text-lg mb-2">Select {artistName}?</h3>
        <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
          This will create a booking request and send it to {artistName}. All other applications will be declined.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-outline-variant/40 rounded-xl py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Selecting…' : 'Yes, select them'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [gig, setGig] = useState<GigPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmApp, setConfirmApp] = useState<Application | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gigRes, appsRes] = await Promise.all([
          fetch(`/api/gigs/${id}`),
          fetch(`/api/gigs/${id}/applications`),
        ]);
        const gigData = await gigRes.json();
        const appsData = await appsRes.json();

        if (!gigRes.ok) { setError(gigData?.error ?? 'Not found'); setLoading(false); return; }

        setGig(gigData.gig as GigPost);
        setApplications(appsData.applications ?? []);
      } catch {
        setError('Failed to load gig');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSelect(app: Application) {
    setSelecting(true);
    try {
      const res = await fetch(`/api/gigs/${id}/applications/${app.id}/select`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Failed to select applicant');
        setConfirmApp(null);
        setSelecting(false);
        return;
      }
      const artistName = app.artists?.display_name ?? 'Artist';
      setSelectedResult(artistName);
      setConfirmApp(null);
      // Refresh gig data
      const gigRes = await fetch(`/api/gigs/${id}`);
      const gigData = await gigRes.json();
      setGig(gigData.gig as GigPost);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: 'selected' }
            : { ...a, status: 'declined' },
        ),
      );
    } catch {
      alert('Something went wrong');
    } finally {
      setSelecting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl">
        <div className="animate-pulse">
          <div className="h-7 bg-surface-container rounded w-1/2 mb-4" />
          <div className="h-4 bg-surface-container rounded w-full mb-2" />
          <div className="h-4 bg-surface-container rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="px-6 py-8">
        <p className="text-error">{error ?? 'Gig not found'}</p>
        <button onClick={() => router.back()} className="mt-3 text-primary text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    open: 'bg-[#E1F5EE] text-primary',
    filled: 'bg-primary text-white',
    cancelled: 'bg-error/10 text-error',
    expired: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <div className="px-6 py-8 max-w-3xl">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-primary hover:underline mb-5 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        My gig posts
      </button>

      {/* Gig summary card */}
      <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="font-bold text-on-surface text-xl">{gig.title}</h1>
          <span className={`flex-shrink-0 text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[gig.status] ?? ''}`}>
            {gig.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-3">
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
              <div className="font-semibold text-on-surface">{gig.venue}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {gig.discipline.map((d) => (
            <span key={d} className="bg-[#E1F5EE] text-primary px-2.5 py-0.5 rounded-full text-[11px] font-mono">
              {d}
            </span>
          ))}
        </div>

        {gig.description && (
          <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">{gig.description}</p>
        )}
      </div>

      {/* Selected result banner */}
      {selectedResult && (
        <div className="bg-[#E1F5EE] border border-primary/20 rounded-xl p-4 mb-5 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4.5 12.75l6 6 9-13.5" stroke="#005440" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold text-primary">
            Booking created — {selectedResult} has been sent a booking request.
          </p>
        </div>
      )}

      {/* Applications */}
      <h2 className="font-bold text-on-surface text-lg mb-3">
        Applications ({applications.length})
      </h2>

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white border border-outline-variant/30 rounded-2xl">
          <p className="text-on-surface-variant text-sm">No applications yet.</p>
          {gig.visibility === 'targeted' && (
            <p className="text-on-surface-variant text-xs mt-1">
              Go to{' '}
              <a href={`/discover?inviteToGig=${gig.id}`} className="text-primary hover:underline">
                Discover
              </a>{' '}
              to invite artists.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const artistName = app.artists?.display_name ?? 'Artist';
            const isSelected = app.status === 'selected';
            const isDeclined = app.status === 'declined';

            return (
              <div
                key={app.id}
                className={`bg-white border rounded-2xl p-5 transition-all ${
                  isSelected ? 'border-primary/40 bg-[#E1F5EE]/30' :
                  isDeclined ? 'border-outline-variant/20 opacity-60' :
                  'border-outline-variant/30'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {app.artists?.profile_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={app.artists.profile_photo}
                      alt={artistName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{artistName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-sm">{artistName}</span>
                      {isSelected && (
                        <span className="bg-primary text-white text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Selected
                        </span>
                      )}
                      {isDeclined && (
                        <span className="bg-surface-container text-on-surface-variant text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Declined
                        </span>
                      )}
                    </div>
                    {app.artists?.slug && (
                      <a href={`/${app.artists.slug}`} className="text-xs text-primary hover:underline">
                        View profile →
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-sm text-on-surface leading-relaxed mb-3">{app.message}</p>

                {app.packages && (
                  <div className="bg-surface-container rounded-lg px-3 py-2 mb-3 text-sm">
                    <span className="text-on-surface-variant text-xs">Referenced package: </span>
                    <span className="font-semibold text-on-surface">{app.packages.name}</span>
                    <span className="text-on-surface-variant ml-1">
                      — {app.packages.currency} {Number(app.packages.price).toLocaleString()}
                      {app.packages.duration ? ` / ${app.packages.duration}` : ''}
                    </span>
                  </div>
                )}

                {gig.status === 'open' && app.status === 'pending' && (
                  <button
                    onClick={() => setConfirmApp(app)}
                    className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Select this artist
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmApp && (
        <ConfirmSelectModal
          artistName={confirmApp.artists?.display_name ?? 'this artist'}
          onConfirm={() => handleSelect(confirmApp)}
          onCancel={() => setConfirmApp(null)}
          loading={selecting}
        />
      )}
    </div>
  );
}
