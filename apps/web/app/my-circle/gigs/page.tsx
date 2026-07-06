'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PostGigPanel } from '@/app/components/gigs/PostGigPanel';
import { AccountMenu } from '@/app/components/nav/AccountMenu';
import type { GigPost } from '@/lib/services/gigs';
import NavbarGigsClient from './NavbarGigsClient';

type GigWithCount = GigPost & { application_count: number };

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  filled: 'Filled',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-[#E1F5EE] text-primary',
  filled: 'bg-primary text-white',
  cancelled: 'bg-error/10 text-error',
  expired: 'bg-surface-container text-on-surface-variant',
};

function GigPostCard({ gig }: { gig: GigWithCount }) {
  return (
    <Link
      href={`/my-circle/gigs/${gig.id}`}
      className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-sm hover:border-primary/20 transition-all group w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-on-surface text-base leading-snug group-hover:text-primary transition-colors">
          {gig.title}
        </h3>
        <span className={`flex-shrink-0 text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[gig.status] ?? ''}`}>
          {STATUS_LABELS[gig.status] ?? gig.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {gig.discipline.map((d) => (
          <span key={d} className="bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full text-[11px] font-mono">
            {d}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
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
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-sm text-on-surface-variant">
          {gig.application_count} application{gig.application_count !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
          View →
        </span>
      </div>
    </Link>
  );
}

export default function MyGigPostsPage() {
  const searchParams = useSearchParams();
  const [gigs, setGigs] = useState<GigWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(searchParams.get('new') === '1');

  async function loadGigs() {
    setLoading(true);
    try {
      const res = await fetch('/api/audience/gigs');
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
  }, []);

  function handleCreated(gig: GigPost) {
    setPanelOpen(false);
    setGigs((prev) => [{ ...gig, application_count: 0 }, ...prev]);
  }

  return (
    <div className="bg-[#F5F3EF] min-h-screen flex flex-col font-sans text-on-surface">
      {/* Responsive Client-side Toolbar Navigation */}
      <NavbarGigsClient onPostClick={() => setPanelOpen(true)} accountMenu={<AccountMenu />} />

      {/* Main Area: flex-1 expansion pushes footer down cleanly */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-10 flex flex-col justify-center">
        <div className="w-full flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-xl sm:text-2xl text-on-surface">My Gig Posts</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Manage your gig listings and review applications.
            </p>
          </div>
          <button
            onClick={() => setPanelOpen(true)}
            className="hidden md:block bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Post a gig
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-outline-variant/30 rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-surface-container rounded w-2/3 mb-3" />
                <div className="h-3 bg-surface-container rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-16 md:py-20 bg-white border border-outline-variant/30 rounded-2xl w-full px-4 my-auto">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="font-bold text-on-surface text-lg mb-2">No gig posts yet</h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-xs mx-auto">
              Post a gig and let East Africa&apos;s finest creative talent pitch to you.
            </p>
            <button
              onClick={() => setPanelOpen(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Post your first gig
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {gigs.map((gig) => (
              <GigPostCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </main>

      {/* Structured Sticky Viewport Base Footer */}
      <footer className="bg-white border-t border-outline-variant/30 py-6 md:py-8 px-4 sm:px-6 md:px-10 w-full shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="text-base sm:text-lg font-bold text-primary">Engero</span>
          <div className="flex gap-6 text-sm">
            {['Privacy', 'Terms', 'Support'].map((item) => (
              <a key={item} href="#" className="text-on-surface-variant hover:text-primary transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>

      <PostGigPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}